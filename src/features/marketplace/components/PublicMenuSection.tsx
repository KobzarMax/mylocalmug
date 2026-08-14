import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CachedImage } from '../../../components/CachedImage';
import { styles } from '../styles';
import { PublicMenu } from '../types';

export function PublicMenuSection({ menu, onAdd }: { menu: PublicMenu; onAdd?: (item: PublicMenu['categories'][number]['items'][number]) => void }) {
  const populated = menu.categories.filter((category) => category.items.length);
  return <View style={styles.section}><Text style={styles.sectionHeading}>Menu</Text>
    {!populated.length && <Text style={styles.stateText}>This shop has not published available menu items yet.</Text>}
    {populated.map((category) => <View key={category.id}><Text style={styles.menuCategory}>{category.name}</Text>
      {category.items.map((item) => <Pressable disabled={!onAdd} onPress={() => onAdd?.(item)} key={item.id} style={styles.menuItem}>
        <CachedImage uri={item.photoUrl} cacheKey={item.photoUrl ?? `menu-${item.id}`} style={styles.menuImage} accessibilityLabel={item.name} />
        <View style={styles.menuCopy}><Text style={styles.menuName}>{item.name}</Text>{item.description ? <Text style={styles.menuDescription}>{item.description}</Text> : null}</View>
        <Text style={styles.price}>£{item.price.toFixed(2)}{onAdd ? '  +' : ''}</Text>
      </Pressable>)}
    </View>)}
  </View>;
}
