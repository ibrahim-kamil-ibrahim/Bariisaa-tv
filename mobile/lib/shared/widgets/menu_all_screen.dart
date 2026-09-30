import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../core/navigation/app_router.dart';
import '../../core/theme/app_theme.dart';
import 'package:naik_mobile/shared/widgets/shared_widgets.dart';

class MenuAllScreen extends StatelessWidget {
  const MenuAllScreen({super.key});

  static final List<_MenuSection> _sections = [
    _MenuSection('Content', [
      _MenuItemData('📚', 'Books', AppRoutes.books, AppTheme.skyBlue),
      _MenuItemData(
        '📖',
        'Storytelling',
        AppRoutes.storytelling,
        AppTheme.softPurple,
      ),
      _MenuItemData('🎵', 'Music', AppRoutes.music, AppTheme.playfulRed),
      _MenuItemData('🩺', 'My Doctor', AppRoutes.myDoctor, AppTheme.mintGreen),
      _MenuItemData(
        '🧑‍✈️',
        'My Captain',
        AppRoutes.myCaptain,
        AppTheme.sunnyYellow,
      ),
      _MenuItemData('✅', 'Habits', AppRoutes.habits, AppTheme.skyBlue),
    ]),
    _MenuSection('History', [
      _MenuItemData(
        '📕',
        'Reading',
        '${AppRoutes.history}?tab=reading',
        AppTheme.softPurple,
      ),
      _MenuItemData(
        '🎧',
        'Listening',
        '${AppRoutes.history}?tab=listening',
        AppTheme.mintGreen,
      ),
      _MenuItemData(
        '🧾',
        'Payments',
        AppRoutes.paymentHistory,
        AppTheme.skyBlue,
      ),
    ]),
    _MenuSection('Account', [
      _MenuItemData('👤', 'Profile', AppRoutes.profile, AppTheme.skyBlue),
      _MenuItemData(
        '✏️',
        'Edit Profile',
        AppRoutes.editProfile,
        AppTheme.softPurple,
      ),
      _MenuItemData(
        '❤️',
        'Favorites',
        AppRoutes.favorites,
        AppTheme.playfulRed,
      ),
      _MenuItemData('📥', 'Downloads', AppRoutes.downloads, AppTheme.mintGreen),
      _MenuItemData(
        '🔔',
        'Notifications',
        AppRoutes.notifications,
        AppTheme.sunnyYellow,
      ),
      _MenuItemData(
        '💬',
        'Messages',
        AppRoutes.conversations,
        AppTheme.skyBlue,
      ),
      _MenuItemData('⭐', 'Plans', AppRoutes.plans, AppTheme.sunnyYellow),
      _MenuItemData('📱', 'Devices', AppRoutes.devices, AppTheme.softPurple),
      _MenuItemData('🔍', 'Search', AppRoutes.searchResults, AppTheme.skyBlue),
    ]),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: AppBar(
        backgroundColor: AppTheme.creamBg,
        elevation: 0,
        leading: context.canPop()
            ? KidsIconButton(
                onTap: () => context.pop(),
                child: const Icon(
                  Icons.arrow_back_rounded,
                  color: AppTheme.darkNavy,
                ),
              )
            : null,
        title: Text(
          'Menu',
          style: AppStyles.baloo2(
            fontSize: AppTheme.titleSize,
            fontWeight: FontWeight.w700,
            color: AppTheme.darkNavy,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          for (final section in _sections) ...[
            Padding(
              padding: const EdgeInsets.only(left: 4, top: 16, bottom: 8),
              child: Text(
                section.title,
                style: AppStyles.baloo2(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.charcoal,
                ),
              ),
            ),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.0,
              ),
              itemCount: section.items.length,
              itemBuilder: (context, index) =>
                  _buildTile(context, section.items[index]),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTile(BuildContext context, _MenuItemData item) {
    return GestureDetector(
      onTap: () => context.push(item.route),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppTheme.textShadow,
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: item.color.withValues(alpha: 0.16),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(item.emoji, style: const TextStyle(fontSize: 24)),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              item.label,
              style: AppStyles.nunito(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuSection {
  final String title;
  final List<_MenuItemData> items;
  const _MenuSection(this.title, this.items);
}

class _MenuItemData {
  final String emoji;
  final String label;
  final String route;
  final Color color;
  const _MenuItemData(this.emoji, this.label, this.route, this.color);
}
