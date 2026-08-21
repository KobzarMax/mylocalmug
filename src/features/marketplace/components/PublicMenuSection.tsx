import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { CachedImage } from '../../../components/CachedImage';
import { MenuCategoryIcon } from '../../../components/MenuCategoryIcon';
import { palette } from '../../../lib/design';
import { ResolvedBusinessTheme } from '../../branding/types';
import { styles } from '../styles';
import { PublicMenu } from '../types';

export function PublicMenuSection({ menu, theme }: { menu: PublicMenu; theme: ResolvedBusinessTheme }) {
  const populated = menu.categories.filter((category) => category.items.length);
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Menu</Text>
      {!populated.length && (
        <Text style={[styles.stateText, { color: theme.mutedText }]}>
          This shop has not published available menu items yet.
        </Text>
      )}
      {populated.map((category) => (
        <View key={category.id}>
          <Text style={[styles.menuCategory, { color: theme.primary }]}>{category.name}</Text>
          {category.items.map((item) => (
            <View key={item.id} style={[styles.menuItem, { borderBottomColor: theme.border }]}>
              <CachedImage
                uri={item.photoUrl}
                cacheKey={item.photoUrl ?? `menu-${item.id}`}
                style={styles.menuImage}
                accessibilityLabel={item.name}
                fallback={<MenuCategoryIcon iconKey={category.iconKey} />}
              />
              <View style={styles.menuCopy}>
                <Text style={[styles.menuName, { color: theme.text }]}>{item.name}</Text>
                {item.event ? (
                  <View style={styles.eventBadge}>
                    <Ionicons name="sparkles" size={13} color={palette.orange} />
                    <Text style={styles.eventBadgeText}>
                      {item.event.badge} · {item.event.title}
                    </Text>
                  </View>
                ) : null}
                {item.event ? (
                  <Text style={[styles.menuDescription, { color: theme.mutedText }]}>
                    {item.event.message}
                  </Text>
                ) : null}
                {item.description ? (
                  <Text style={[styles.menuDescription, { color: theme.mutedText }]}>{item.description}</Text>
                ) : null}
              </View>
              <Text style={[styles.price, { color: theme.primary }]}>£{item.price.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
