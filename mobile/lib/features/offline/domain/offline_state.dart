import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class OfflineState extends Equatable {
  const OfflineState();

  @override
  List<Object?> get props => [];
}

class OfflineInitial extends OfflineState {}

class OfflineLoading extends OfflineState {}

class OfflineLoaded extends OfflineState {
  final List<DownloadItemModel> downloads;
  final int storageUsed;

  const OfflineLoaded({this.downloads = const [], this.storageUsed = 0});

  OfflineLoaded copyWith({
    List<DownloadItemModel>? downloads,
    int? storageUsed,
  }) {
    return OfflineLoaded(
      downloads: downloads ?? this.downloads,
      storageUsed: storageUsed ?? this.storageUsed,
    );
  }

  @override
  List<Object?> get props => [downloads, storageUsed];
}

class OfflineError extends OfflineState {
  final String message;

  const OfflineError(this.message);

  @override
  List<Object?> get props => [message];
}
