import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/di/injection.dart';
import '../../../shared/models/models.dart';

class OfflineRepository {
  final ApiClient _apiClient = getIt<ApiClient>();
  final Map<String, CancelToken> _cancelTokens = {};

  Future<List<DownloadItemModel>> getDownloads() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${dir.path}/downloads');
      if (!await downloadDir.exists()) return [];
      final jsonFile = File('${dir.path}/downloads/manifest.json');
      if (!await jsonFile.exists()) return [];
      final content = await jsonFile.readAsString();
      if (content.isEmpty) return [];
      final List<dynamic> jsonList = jsonDecode(content) as List<dynamic>;
      return jsonList
          .map((e) => DownloadItemModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _writeManifestAtomically(
    File jsonFile,
    List<DownloadItemModel> items,
  ) async {
    try {
      final tempFile = File('${jsonFile.path}.tmp');
      await tempFile.writeAsString(
        jsonEncode(items.map((e) => e.toJson()).toList()),
      );
      if (await tempFile.exists()) {
        await tempFile.rename(jsonFile.path);
      }
    } catch (_) {
      try {
        await jsonFile.writeAsString(
          jsonEncode(items.map((e) => e.toJson()).toList()),
        );
      } catch (e) {
        // Offline manifest write failed — non-fatal
      }
    }
  }

  Future<void> addToManifest(DownloadItemModel item) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${dir.path}/downloads');
      await downloadDir.create(recursive: true);
      final jsonFile = File('${dir.path}/downloads/manifest.json');
      List<DownloadItemModel> items = [];
      if (await jsonFile.exists()) {
        final content = await jsonFile.readAsString();
        if (content.isNotEmpty) {
          final List<dynamic> jsonList = jsonDecode(content) as List<dynamic>;
          items = jsonList
              .map((e) => DownloadItemModel.fromJson(e as Map<String, dynamic>))
              .toList();
        }
      }
      final index = items.indexWhere(
        (d) => d.bookId == item.bookId && d.type == item.type,
      );
      if (index >= 0) {
        items[index] = item;
      } else {
        items.add(item);
      }
      await _writeManifestAtomically(jsonFile, items);
    } catch (_) {}
  }

  Future<void> startDownload(
    BookModel book,
    String type, {
    void Function(double)? onProgress,
  }) async {
    final dir = await getApplicationDocumentsDirectory();
    final downloadDir = Directory('${dir.path}/downloads');
    await downloadDir.create(recursive: true);

    final fileUrl = type == 'audio'
        ? book.audioFile?.fileUrl
        : book.pdfFile?.fileUrl;
    final fileSizeBytes = type == 'audio'
        ? (book.audioFile?.fileSizeBytes ?? 0)
        : (book.pdfFile?.fileSizeBytes ?? 0);

    final item = DownloadItemModel(
      bookId: book.id,
      title: book.title,
      coverUrl: book.coverUrl,
      type: type,
      totalBytes: fileSizeBytes,
      status: 'downloading',
    );
    await addToManifest(item);

    if (fileUrl == null) return;

    final cancelToken = CancelToken();
    _cancelTokens['${book.id}_$type'] = cancelToken;

    final rawName = fileUrl.split('/').last.split('?').first;
    final fileName = '${book.id}_${type}_$rawName';
    final filePath = '${downloadDir.path}/$fileName';

    try {
      await _apiClient.dio.download(
        fileUrl,
        filePath,
        cancelToken: cancelToken,
        onReceiveProgress: (received, total) {
          final progress = total != -1 ? received / total : 0.0;
          onProgress?.call(progress);
        },
      );

      await _updateManifestItem(
        DownloadItemModel(
          bookId: book.id,
          title: book.title,
          coverUrl: book.coverUrl,
          type: type,
          totalBytes: fileSizeBytes,
          downloadedBytes: fileSizeBytes,
          status: 'completed',
          localPath: filePath,
        ),
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.cancel) {
        await _updateManifestItem(
          DownloadItemModel(
            bookId: book.id,
            title: book.title,
            coverUrl: book.coverUrl,
            type: type,
            totalBytes: fileSizeBytes,
            status: 'paused',
          ),
        );
      } else {
        await _updateManifestItem(
          DownloadItemModel(
            bookId: book.id,
            title: book.title,
            coverUrl: book.coverUrl,
            type: type,
            totalBytes: fileSizeBytes,
            status: 'failed',
          ),
        );
      }
    } finally {
      _cancelTokens.remove('${book.id}_$type');
    }
  }

  void pauseDownload(String bookId, [String? type]) {
    if (type != null) {
      _cancelTokens['${bookId}_$type']?.cancel();
    } else {
      _cancelTokens['${bookId}_audio']?.cancel();
      _cancelTokens['${bookId}_pdf']?.cancel();
    }
  }

  Future<void> resumeDownload(DownloadItemModel item) async {
    final response = await _apiClient.get('/books/${item.bookId}');
    final book = BookModel.fromJson(response.data['data']);
    final fileUrl = item.type == 'audio'
        ? book.audioFile?.fileUrl
        : book.pdfFile?.fileUrl;
    if (fileUrl == null) return;
    final dir = await getApplicationDocumentsDirectory();
    final downloadDir = Directory('${dir.path}/downloads');
    await downloadDir.create(recursive: true);
    final rawName = fileUrl.split('/').last.split('?').first;
    final fileName = '${item.bookId}_${item.type}_$rawName';
    final filePath = '${downloadDir.path}/$fileName';
    final cancelToken = CancelToken();
    _cancelTokens['${item.bookId}_${item.type}'] = cancelToken;
    try {
      await _apiClient.dio.download(
        fileUrl,
        filePath,
        cancelToken: cancelToken,
      );
      final totalBytes = item.type == 'audio'
          ? (book.audioFile?.fileSizeBytes ?? 0)
          : (book.pdfFile?.fileSizeBytes ?? 0);
      await _updateManifestItem(
        DownloadItemModel(
          bookId: item.bookId,
          title: item.title,
          coverUrl: item.coverUrl,
          type: item.type,
          totalBytes: totalBytes,
          downloadedBytes: totalBytes,
          status: 'completed',
          localPath: filePath,
        ),
      );
    } on DioException catch (e) {
      if (e.type != DioExceptionType.cancel) {
        await _updateManifestItem(
          DownloadItemModel(
            bookId: item.bookId,
            title: item.title,
            coverUrl: item.coverUrl,
            type: item.type,
            status: 'failed',
          ),
        );
      }
    } finally {
      _cancelTokens.remove('${item.bookId}_${item.type}');
    }
  }

  Future<void> _updateManifestItem(DownloadItemModel updatedItem) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final jsonFile = File('${dir.path}/downloads/manifest.json');
      if (!await jsonFile.exists()) return;
      final content = await jsonFile.readAsString();
      if (content.isEmpty) return;
      final List<dynamic> jsonList = jsonDecode(content) as List<dynamic>;
      final items = jsonList
          .map((e) => DownloadItemModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final index = items.indexWhere(
        (item) =>
            item.bookId == updatedItem.bookId && item.type == updatedItem.type,
      );
      if (index >= 0) {
        items[index] = updatedItem;
      } else {
        items.add(updatedItem);
      }
      await _writeManifestAtomically(jsonFile, items);
    } catch (_) {
      // Offline manifest update failed — non-fatal
    }
  }

  Future<void> deleteDownload(String bookId, String type) async {
    pauseDownload(bookId, type);
    try {
      final dir = await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${dir.path}/downloads');
      if (await downloadDir.exists()) {
        await for (var entity in downloadDir.list()) {
          if (entity is File &&
              (entity.path.contains('${bookId}_$type') ||
                  entity.path.contains(bookId))) {
            await entity.delete();
          }
        }
      }
      final jsonFile = File('${dir.path}/downloads/manifest.json');
      if (await jsonFile.exists()) {
        final content = await jsonFile.readAsString();
        if (content.isNotEmpty) {
          final List<dynamic> jsonList = jsonDecode(content) as List<dynamic>;
          final items = jsonList
              .map((e) => DownloadItemModel.fromJson(e as Map<String, dynamic>))
              .where((d) => !(d.bookId == bookId && d.type == type))
              .toList();
          await _writeManifestAtomically(jsonFile, items);
        }
      }
    } catch (_) {
      // Offline cleanup failed — non-fatal
    }
  }

  Future<void> clearAllDownloads() async {
    for (final t in _cancelTokens.values) {
      t.cancel();
    }
    _cancelTokens.clear();
    try {
      final dir = await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${dir.path}/downloads');
      if (await downloadDir.exists()) {
        await downloadDir.delete(recursive: true);
      }
    } catch (_) {
      // Offline cleanup failed — non-fatal
    }
  }

  Future<int> getStorageUsed() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${dir.path}/downloads');
      if (!await downloadDir.exists()) return 0;
      int totalSize = 0;
      await for (var entity in downloadDir.list(recursive: true)) {
        if (entity is File) totalSize += await entity.length();
      }
      return totalSize;
    } catch (_) {
      return 0;
    }
  }
}
