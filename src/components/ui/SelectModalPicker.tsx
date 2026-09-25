import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export interface PickerItem {
  label: string;
  value: string;
  subtitle?: string;
}

interface SelectModalPickerProps {
  visible: boolean;
  title: string;
  placeholder?: string;
  items: PickerItem[];
  selectedValue?: string;
  isLoading?: boolean;
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
}

export const SelectModalPicker: React.FC<SelectModalPickerProps> = ({
  visible,
  title,
  placeholder = 'Cari...',
  items,
  selectedValue,
  isLoading = false,
  onSelect,
  onClose,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    const query = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleSelect = (item: PickerItem) => {
    setSearchQuery('');
    onSelect(item);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              {title}
            </ThemedText>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <ThemedText style={{ fontSize: 18, opacity: 0.6 }}>✕</ThemedText>
            </Pressable>
          </View>

          {/* Search Box */}
          <View style={[styles.searchBox, { borderBottomColor: theme.border }]}>
            <ThemedText style={{ fontSize: 14, opacity: 0.5 }}>🔍</ThemedText>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={placeholder}
              placeholderTextColor={theme.border}
              autoCorrect={false}
              style={[
                styles.searchInput,
                {
                  color: theme.text,
                },
              ]}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <ThemedText style={{ fontSize: 13, opacity: 0.5 }}>✕</ThemedText>
              </Pressable>
            )}
          </View>

          {/* List or Loading State */}
          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText type="small" style={{ opacity: 0.7, marginTop: 10 }}>
                Memuat data...
              </ThemedText>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.centerState}>
              <ThemedText style={{ fontSize: 28 }}>🔍</ThemedText>
              <ThemedText type="smallBold" style={{ marginTop: 8 }}>
                Tidak Ditemukan
              </ThemedText>
              <ThemedText type="small" style={{ opacity: 0.6, marginTop: 4 }}>
                Tidak ada hasil yang sesuai dengan "{searchQuery}"
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => [
                      styles.itemRow,
                      {
                        borderBottomColor: theme.border + '60',
                        backgroundColor: isSelected
                          ? theme.primary + '15'
                          : pressed
                          ? theme.backgroundElement
                          : 'transparent',
                      },
                    ]}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <ThemedText
                        type="default"
                        style={[
                          styles.itemLabel,
                          isSelected && { color: theme.primary, fontWeight: '700' },
                        ]}
                      >
                        {item.label}
                      </ThemedText>
                      {item.subtitle ? (
                        <ThemedText type="small" style={styles.itemSubtitle}>
                          {item.subtitle}
                        </ThemedText>
                      ) : null}
                    </View>
                    {isSelected && (
                      <ThemedText style={{ color: theme.primary, fontWeight: '700' }}>
                        ✓
                      </ThemedText>
                    )}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    height: '80%',
    maxHeight: 600,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
    cursor: 'pointer' as any,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    cursor: 'pointer' as any,
  },
  itemLabel: {
    fontSize: 14,
  },
  itemSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
});
