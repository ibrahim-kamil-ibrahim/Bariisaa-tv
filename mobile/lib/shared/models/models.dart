class UserModel {
  final String id;
  final String? username;
  final String? email;
  final String? phone;
  final String name;
  final String? avatarUrl;
  final bool emailVerified;
  final bool phoneVerified;
  final String status;
  final String preferredLanguage;
  final String accountStatus;
  final Map<String, dynamic>? profileData;

  UserModel({
    required this.id,
    this.username,
    this.email,
    this.phone,
    required this.name,
    this.avatarUrl,
    this.emailVerified = false,
    this.phoneVerified = false,
    this.status = 'active',
    this.preferredLanguage = 'en',
    this.accountStatus = 'guest',
    this.profileData,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id: json['id'] as String,
    username: json['username'] as String?,
    email: json['email'] as String?,
    phone: json['phone'] as String?,
    name: json['name'] as String,
    avatarUrl: json['avatarUrl'] as String?,
    emailVerified: json['emailVerified'] as bool? ?? false,
    phoneVerified: json['phoneVerified'] as bool? ?? false,
    status: json['status'] as String? ?? 'active',
    preferredLanguage: json['preferredLanguage'] as String? ?? 'en',
    accountStatus: json['accountStatus'] as String? ?? 'guest',
    profileData: json['profileData'] != null
        ? Map<String, dynamic>.from(json['profileData'] as Map)
        : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    'email': email,
    'phone': phone,
    'name': name,
    'avatarUrl': avatarUrl,
    'emailVerified': emailVerified,
    'phoneVerified': phoneVerified,
    'status': status,
    'preferredLanguage': preferredLanguage,
    'accountStatus': accountStatus,
    'profileData': profileData,
  };
}

class BookModel {
  final String id;
  final String title;
  final String? description;
  final String? coverUrl;
  final String? thumbnailUrl;
  final String language;
  final bool isFeatured;
  final bool isPremium;
  final bool isFree;
  final String? accessTier;
  final bool? isLocked;
  final String status;
  final double avgRating;
  final int ratingCount;
  final int viewCount;
  final List<AuthorModel> authors;
  final List<CategoryModel> categories;
  final List<String> tags;
  final AudioFileModel? audioFile;
  final PdfFileModel? pdfFile;

  BookModel({
    required this.id,
    required this.title,
    this.description,
    this.coverUrl,
    this.thumbnailUrl,
    this.language = 'en',
    this.isFeatured = false,
    this.isPremium = false,
    this.isFree = false,
    this.accessTier,
    this.isLocked,
    this.status = 'published',
    this.avgRating = 0.0,
    this.ratingCount = 0,
    this.viewCount = 0,
    this.authors = const [],
    this.categories = const [],
    this.tags = const [],
    this.audioFile,
    this.pdfFile,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) => BookModel(
    id: json['id'] as String,
    title: json['title'] as String,
    description: json['description'] as String?,
    coverUrl: json['coverUrl'] as String?,
    thumbnailUrl: json['thumbnailUrl'] as String?,
    language: json['language'] as String? ?? 'en',
    isFeatured: json['isFeatured'] as bool? ?? false,
    isPremium: json['isPremium'] as bool? ?? false,
    isFree: json['isFree'] as bool? ?? false,
    status: json['status'] as String? ?? 'published',
    avgRating: (json['avgRating'] as num?)?.toDouble() ?? 0.0,
    ratingCount: json['ratingCount'] as int? ?? 0,
    viewCount: json['viewCount'] as int? ?? 0,
    authors:
        (json['authors'] as List<dynamic>?)?.map((e) {
          final m = e as Map<String, dynamic>;
          final a = (m['author'] ?? m) as Map<String, dynamic>;
          return AuthorModel(
            id: a['id'] as String? ?? '',
            name: a['name'] as String? ?? '',
            bio: a['bio'] as String?,
            photoUrl: a['photoUrl'] as String?,
          );
        }).toList() ??
        [],
    categories:
        (json['categories'] as List<dynamic>?)?.map((e) {
          final m = e as Map<String, dynamic>;
          final c = (m['category'] ?? m) as Map<String, dynamic>;
          return CategoryModel(
            id: c['id']?.toString() ?? '',
            name: c['name']?.toString() ?? '',
            description: c['description'] as String?,
            slug: c['slug']?.toString() ?? '',
          );
        }).toList() ??
        [],
    tags:
        (json['tags'] as List<dynamic>?)?.map((e) {
          if (e is String) return e;
          final m = e as Map<String, dynamic>;
          return (m['tag'] ?? m)['name'] as String? ?? '';
        }).toList() ??
        [],
    accessTier: json['accessTier'] as String?,
    isLocked: json['isLocked'] as bool?,
    audioFile: _firstAudioFile(json['audioFiles'] as List<dynamic>?),
    pdfFile: _firstPdfFile(json['pdfFiles'] as List<dynamic>?),
  );

  static AudioFileModel? _firstAudioFile(List<dynamic>? files) {
    if (files == null || files.isEmpty) return null;
    final f = files.first as Map<String, dynamic>;
    return AudioFileModel(
      id: f['id'] as String? ?? '',
      fileUrl: f['fileUrl'] as String? ?? '',
      durationSeconds: f['durationSeconds'] as int? ?? 0,
      fileSizeBytes: (f['fileSizeBytes'] as num?)?.toInt() ?? 0,
      format: f['format'] as String? ?? 'mp3',
      chapters: ((f['chapters'] as List<dynamic>?) ?? [])
          .map((c) => AudioChapterModel.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }

  static PdfFileModel? _firstPdfFile(List<dynamic>? files) {
    if (files == null || files.isEmpty) return null;
    final f = files.first as Map<String, dynamic>;
    return PdfFileModel(
      id: f['id'] as String? ?? '',
      fileUrl: f['fileUrl'] as String? ?? '',
      pageCount: (f['pageCount'] as int?) ?? 0,
      fileSizeBytes: (f['fileSizeBytes'] as num?)?.toInt() ?? 0,
    );
  }
}

class AuthorModel {
  final String id;
  final String name;
  final String? bio;
  final String? photoUrl;

  AuthorModel({required this.id, required this.name, this.bio, this.photoUrl});

  factory AuthorModel.fromJson(Map<String, dynamic> json) => AuthorModel(
    id: json['id'] as String,
    name: json['name'] as String,
    bio: json['bio'] as String?,
    photoUrl: json['photoUrl'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'bio': bio,
    'photoUrl': photoUrl,
  };
}

class CategoryModel {
  final String id;
  final String name;
  final String? description;
  final String slug;
  final String? imageUrl;
  final String? iconEmoji;
  final String? route;
  final int sortOrder;

  CategoryModel({
    required this.id,
    required this.name,
    this.description,
    required this.slug,
    this.imageUrl,
    this.iconEmoji,
    this.route,
    this.sortOrder = 0,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) => CategoryModel(
    id: json['id'] as String,
    name: json['name'] as String,
    description: json['description'] as String?,
    slug: json['slug'] as String? ?? '',
    imageUrl: json['imageUrl'] as String?,
    iconEmoji: json['iconEmoji'] as String?,
    route: json['route'] as String?,
    sortOrder: json['sortOrder'] as int? ?? 0,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'slug': slug,
    'imageUrl': imageUrl,
    'iconEmoji': iconEmoji,
    'route': route,
    'sortOrder': sortOrder,
  };
}

class AudioFileModel {
  final String id;
  final String fileUrl;
  final int durationSeconds;
  final int fileSizeBytes;
  final String format;
  final List<AudioChapterModel> chapters;

  AudioFileModel({
    required this.id,
    required this.fileUrl,
    this.durationSeconds = 0,
    this.fileSizeBytes = 0,
    this.format = 'mp3',
    this.chapters = const [],
  });

  factory AudioFileModel.fromJson(Map<String, dynamic> json) => AudioFileModel(
    id: json['id']?.toString() ?? '',
    fileUrl: json['fileUrl']?.toString() ?? '',
    durationSeconds: (json['durationSeconds'] as num?)?.toInt() ?? 0,
    fileSizeBytes: (json['fileSizeBytes'] as num?)?.toInt() ?? 0,
    format: json['format'] as String? ?? 'mp3',
    chapters:
        (json['chapters'] as List<dynamic>?)
            ?.map((e) => AudioChapterModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [],
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'fileUrl': fileUrl,
    'durationSeconds': durationSeconds,
    'fileSizeBytes': fileSizeBytes,
    'format': format,
    'chapters': chapters.map((e) => e.toJson()).toList(),
  };
}

class AudioChapterModel {
  final String id;
  final String title;
  final int startSeconds;
  final int endSeconds;
  final int trackOrder;

  AudioChapterModel({
    required this.id,
    required this.title,
    this.startSeconds = 0,
    this.endSeconds = 0,
    this.trackOrder = 0,
  });

  factory AudioChapterModel.fromJson(Map<String, dynamic> json) =>
      AudioChapterModel(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        startSeconds: (json['startSeconds'] as num?)?.toInt() ?? 0,
        endSeconds: (json['endSeconds'] as num?)?.toInt() ?? 0,
        trackOrder: (json['trackOrder'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'startSeconds': startSeconds,
    'endSeconds': endSeconds,
    'trackOrder': trackOrder,
  };
}

class PdfFileModel {
  final String id;
  final String fileUrl;
  final int pageCount;
  final int fileSizeBytes;

  PdfFileModel({
    required this.id,
    required this.fileUrl,
    this.pageCount = 0,
    this.fileSizeBytes = 0,
  });

  factory PdfFileModel.fromJson(Map<String, dynamic> json) => PdfFileModel(
    id: json['id']?.toString() ?? '',
    fileUrl: json['fileUrl']?.toString() ?? '',
    pageCount: (json['pageCount'] as num?)?.toInt() ?? 0,
    fileSizeBytes: (json['fileSizeBytes'] as num?)?.toInt() ?? 0,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'fileUrl': fileUrl,
    'pageCount': pageCount,
    'fileSizeBytes': fileSizeBytes,
  };
}

class SubscriptionPlanModel {
  final String id;
  final String name;
  final int durationMonths;
  final double price;
  final String currency;
  final List<String> features;
  final bool isActive;

  SubscriptionPlanModel({
    required this.id,
    required this.name,
    this.durationMonths = 1,
    this.price = 0.0,
    this.currency = 'USD',
    this.features = const [],
    this.isActive = true,
  });

  factory SubscriptionPlanModel.fromJson(Map<String, dynamic> json) =>
      SubscriptionPlanModel(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        durationMonths: (json['durationMonths'] as num?)?.toInt() ?? 1,
        price: (json['price'] as num?)?.toDouble() ?? 0.0,
        currency: json['currency'] as String? ?? 'USD',
        features: _parseFeatures(json['features']),
        isActive: json['isActive'] as bool? ?? true,
      );

  static List<String> _parseFeatures(dynamic features) {
    if (features is List)
      return features.map((e) => e.toString()).toList().cast<String>();
    if (features is Map) {
      final list = <String>[];
      for (final e in features.entries) {
        final key = e.key
            .replaceAllMapped(RegExp(r'[A-Z]'), (Match m) => ' ${m.group(0)}')
            .replaceFirstMapped(
              RegExp(r'^.'),
              (Match m) => m.group(0)!.toUpperCase(),
            );
        if (e.value is bool) {
          list.add(key);
        } else {
          list.add('$key: ${e.value}');
        }
      }
      return list;
    }
    return [];
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'durationMonths': durationMonths,
    'price': price,
    'currency': currency,
    'features': features,
    'isActive': isActive,
  };
}

class SubscriptionModel {
  final String id;
  final SubscriptionPlanModel plan;
  final DateTime startDate;
  final DateTime endDate;
  final String status;
  final bool autoRenew;

  SubscriptionModel({
    required this.id,
    required this.plan,
    required this.startDate,
    required this.endDate,
    this.status = 'active',
    this.autoRenew = false,
  });

  bool get isActive => status == 'active' && DateTime.now().isBefore(endDate);

  int get daysRemaining => DateTime.now().isBefore(endDate)
      ? endDate.difference(DateTime.now()).inDays
      : 0;

  factory SubscriptionModel.fromJson(
    Map<String, dynamic> json, {
    SubscriptionPlanModel? plan,
  }) => SubscriptionModel(
    id: json['id']?.toString() ?? '',
    plan:
        plan ??
        (json['plan'] is Map
            ? SubscriptionPlanModel.fromJson(
                json['plan'] as Map<String, dynamic>,
              )
            : SubscriptionPlanModel(id: '', name: 'Standard')),
    startDate: json['startDate'] != null
        ? (DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now())
        : DateTime.now(),
    endDate: json['endDate'] != null
        ? (DateTime.tryParse(json['endDate'].toString()) ?? DateTime.now())
        : DateTime.now(),
    status: json['status'] as String? ?? 'active',
    autoRenew: json['autoRenew'] as bool? ?? false,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'plan': plan.toJson(),
    'startDate': startDate.toIso8601String(),
    'endDate': endDate.toIso8601String(),
    'status': status,
    'autoRenew': autoRenew,
  };
}

class PaymentModel {
  final String id;
  final double amount;
  final String currency;
  final String gateway;
  final String status;
  final DateTime createdAt;

  PaymentModel({
    required this.id,
    this.amount = 0.0,
    this.currency = 'USD',
    this.gateway = 'stripe',
    this.status = 'pending',
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory PaymentModel.fromJson(Map<String, dynamic> json) => PaymentModel(
    id: json['id']?.toString() ?? '',
    amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
    currency: json['currency'] as String? ?? 'USD',
    gateway: json['gateway'] as String? ?? 'stripe',
    status: json['status'] as String? ?? 'pending',
    createdAt: json['createdAt'] != null
        ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
        : DateTime.now(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'amount': amount,
    'currency': currency,
    'gateway': gateway,
    'status': status,
    'createdAt': createdAt.toIso8601String(),
  };
}

class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    this.type = 'general',
    this.isRead = false,
    this.readAt,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory NotificationModel.fromJson(Map<String, dynamic> json) =>
      NotificationModel(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        body: json['body']?.toString() ?? '',
        type: json['type'] as String? ?? 'general',
        isRead: json['isRead'] as bool? ?? false,
        readAt: json['readAt'] != null
            ? DateTime.tryParse(json['readAt'].toString())
            : null,
        createdAt: json['createdAt'] != null
            ? (DateTime.tryParse(json['createdAt'].toString()) ??
                  DateTime.now())
            : DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'body': body,
    'type': type,
    'isRead': isRead,
    'readAt': readAt?.toIso8601String(),
    'createdAt': createdAt.toIso8601String(),
  };
}

class DeviceModel {
  final String id;
  final String deviceUid;
  final String deviceName;
  final String platform;
  final String? osVersion;
  final DateTime lastActiveAt;

  DeviceModel({
    required this.id,
    required this.deviceUid,
    this.deviceName = 'Unknown',
    this.platform = 'android',
    this.osVersion,
    DateTime? lastActiveAt,
  }) : lastActiveAt = lastActiveAt ?? DateTime.now();

  factory DeviceModel.fromJson(Map<String, dynamic> json) => DeviceModel(
    id: json['id'] as String,
    deviceUid: json['deviceUid'] as String,
    deviceName: json['deviceName'] as String? ?? 'Unknown',
    platform: json['platform'] as String? ?? 'android',
    osVersion: json['osVersion'] as String?,
    lastActiveAt: json['lastActiveAt'] != null
        ? DateTime.parse(json['lastActiveAt'] as String)
        : DateTime.now(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'deviceUid': deviceUid,
    'deviceName': deviceName,
    'platform': platform,
    'osVersion': osVersion,
    'lastActiveAt': lastActiveAt.toIso8601String(),
  };
}

class ReviewModel {
  final String id;
  final UserModel user;
  final double rating;
  final String? content;
  final DateTime createdAt;

  ReviewModel({
    required this.id,
    required this.user,
    this.rating = 5.0,
    this.content,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory ReviewModel.fromJson(Map<String, dynamic> json) => ReviewModel(
    id: json['id']?.toString() ?? '',
    user: json['user'] is Map
        ? UserModel.fromJson(json['user'] as Map<String, dynamic>)
        : UserModel(id: 'unknown', name: 'Reader'),
    rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
    content: json['content'] as String?,
    createdAt: json['createdAt'] != null
        ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
        : DateTime.now(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'user': user.toJson(),
    'rating': rating,
    'content': content,
    'createdAt': createdAt.toIso8601String(),
  };
}

class BookmarkModel {
  final String id;
  final String bookId;
  final String type;
  final String? position;
  final String? label;
  final int? timestampSeconds;
  final DateTime createdAt;

  BookmarkModel({
    required this.id,
    required this.bookId,
    this.type = 'page',
    this.position,
    this.label,
    this.timestampSeconds,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory BookmarkModel.fromJson(Map<String, dynamic> json) => BookmarkModel(
    id: json['id']?.toString() ?? '',
    bookId: json['bookId']?.toString() ?? '',
    type: json['type'] as String? ?? 'page',
    position: json['position'] as String?,
    label: json['label'] as String?,
    timestampSeconds: (json['timestampSeconds'] as num?)?.toInt(),
    createdAt: json['createdAt'] != null
        ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
        : DateTime.now(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'bookId': bookId,
    'type': type,
    'position': position,
    'label': label,
    'timestampSeconds': timestampSeconds,
    'createdAt': createdAt.toIso8601String(),
  };
}

class DownloadItemModel {
  final String bookId;
  final String title;
  final String? coverUrl;
  final String type;
  final int totalBytes;
  final int downloadedBytes;
  final String status;
  final String? localPath;

  DownloadItemModel({
    required this.bookId,
    required this.title,
    this.coverUrl,
    this.type = 'audio',
    this.totalBytes = 0,
    this.downloadedBytes = 0,
    this.status = 'pending',
    this.localPath,
  });

  double get progress => totalBytes > 0 ? downloadedBytes / totalBytes : 0.0;

  bool get isDownloading => status == 'downloading';
  bool get isCompleted => status == 'completed';
  bool get isPaused => status == 'paused';
  bool get isFailed => status == 'failed';
  bool get isPending => status == 'pending';

  factory DownloadItemModel.fromJson(Map<String, dynamic> json) =>
      DownloadItemModel(
        bookId: json['bookId'] as String,
        title: json['title'] as String,
        coverUrl: json['coverUrl'] as String?,
        type: json['type'] as String? ?? 'audio',
        totalBytes: json['totalBytes'] as int? ?? 0,
        downloadedBytes: json['downloadedBytes'] as int? ?? 0,
        status: json['status'] as String? ?? 'pending',
        localPath: json['localPath'] as String?,
      );

  Map<String, dynamic> toJson() => {
    'bookId': bookId,
    'title': title,
    'coverUrl': coverUrl,
    'type': type,
    'totalBytes': totalBytes,
    'downloadedBytes': downloadedBytes,
    'status': status,
    'localPath': localPath,
  };
}

class ConversationModel {
  final String id;
  final UserModel? otherUser;
  final LastMessageModel? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;

  ConversationModel({
    required this.id,
    this.otherUser,
    this.lastMessage,
    this.unreadCount = 0,
    DateTime? updatedAt,
  }) : updatedAt = updatedAt ?? DateTime.now();

  factory ConversationModel.fromJson(Map<String, dynamic> json) =>
      ConversationModel(
        id: json['id'] as String,
        otherUser: json['otherUser'] != null
            ? UserModel.fromJson(json['otherUser'] as Map<String, dynamic>)
            : null,
        lastMessage: json['lastMessage'] != null
            ? LastMessageModel.fromJson(
                json['lastMessage'] as Map<String, dynamic>,
              )
            : null,
        unreadCount: json['unreadCount'] as int? ?? 0,
        updatedAt: json['updatedAt'] != null
            ? DateTime.parse(json['updatedAt'] as String)
            : DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'otherUser': otherUser?.toJson(),
    'lastMessage': lastMessage?.toJson(),
    'unreadCount': unreadCount,
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class LastMessageModel {
  final String content;
  final String senderId;
  final DateTime createdAt;

  LastMessageModel({
    required this.content,
    required this.senderId,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory LastMessageModel.fromJson(Map<String, dynamic> json) =>
      LastMessageModel(
        content: json['content']?.toString() ?? '',
        senderId: json['senderId']?.toString() ?? '',
        createdAt: json['createdAt'] != null
            ? (DateTime.tryParse(json['createdAt'].toString()) ??
                  DateTime.now())
            : DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
    'content': content,
    'senderId': senderId,
    'createdAt': createdAt.toIso8601String(),
  };
}

class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String receiverId;
  final String content;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;
  final UserModel? sender;

  MessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.receiverId,
    required this.content,
    this.isRead = false,
    this.readAt,
    DateTime? createdAt,
    this.sender,
  }) : createdAt = createdAt ?? DateTime.now();

  factory MessageModel.fromJson(Map<String, dynamic> json) => MessageModel(
    id: json['id']?.toString() ?? '',
    conversationId: json['conversationId']?.toString() ?? '',
    senderId: json['senderId']?.toString() ?? '',
    receiverId: json['receiverId']?.toString() ?? '',
    content: json['content']?.toString() ?? '',
    isRead: json['isRead'] as bool? ?? false,
    readAt: json['readAt'] != null
        ? DateTime.tryParse(json['readAt'].toString())
        : null,
    createdAt: json['createdAt'] != null
        ? (DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now())
        : DateTime.now(),
    sender: json['sender'] != null && json['sender'] is Map
        ? UserModel.fromJson(json['sender'] as Map<String, dynamic>)
        : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'conversationId': conversationId,
    'senderId': senderId,
    'receiverId': receiverId,
    'content': content,
    'isRead': isRead,
    'readAt': readAt?.toIso8601String(),
    'createdAt': createdAt.toIso8601String(),
  };
}

class VideoModel {
  final String id;
  final String name;
  final String? mimeType;
  final int? size;
  final String? url;
  final String? thumbnailUrl;
  final String visibility;
  final int? durationSeconds;
  final String? bookId;
  final String uploadStatus;

  VideoModel({
    required this.id,
    required this.name,
    this.mimeType,
    this.size,
    this.url,
    this.thumbnailUrl,
    this.visibility = 'PUBLIC',
    this.durationSeconds,
    this.bookId,
    this.uploadStatus = 'COMPLETED',
  });

  factory VideoModel.fromJson(Map<String, dynamic> json) => VideoModel(
    id: json['id'] as String,
    name: json['name'] as String? ?? '',
    mimeType: json['mimeType'] as String?,
    size: (json['size'] as num?)?.toInt(),
    url: json['url'] as String?,
    thumbnailUrl: json['thumbnailUrl'] as String?,
    visibility: json['visibility'] as String? ?? 'PUBLIC',
    durationSeconds: (json['durationSeconds'] as num?)?.toInt(),
    bookId: json['bookId'] as String?,
    uploadStatus: json['uploadStatus'] as String? ?? 'COMPLETED',
  );
}
