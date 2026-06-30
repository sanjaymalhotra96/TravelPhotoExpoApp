import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { t } from '@/utils/i18n';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'brand' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  description,
  confirmText = t('common.confirm'),
  cancelText = t('common.cancel'),
  confirmVariant = 'brand',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-slate-900/60 justify-center items-center p-6">
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 shadow-2xl w-full max-w-[90%]">
          <Text className="text-light-text dark:text-dark-text font-extrabold text-xl mb-2 text-center">
            {title}
          </Text>
          
          <Text className="text-light-muted dark:text-dark-muted text-sm text-center leading-relaxed mb-6">
            {description}
          </Text>

          <View className="flex-row justify-between">
            <View className="w-[47%]">
              <Pressable
                onPress={onCancel}
                className="w-full flex-row items-center justify-center py-4 px-6 rounded-2xl border border-primary-500 bg-transparent dark:border-primary-400 active:opacity-60"
              >
                <Text className="text-base font-semibold text-center tracking-wide text-primary-500 dark:text-primary-400">
                  {cancelText}
                </Text>
              </Pressable>
            </View>
            <View className="w-[47%]">
              <Pressable
                onPress={onConfirm}
                className={`w-full flex-row items-center justify-center py-4 px-6 rounded-2xl ${
                  confirmVariant === 'danger' ? 'bg-danger active:bg-danger-dark' : 'bg-primary-500 active:bg-primary-600'
                } shadow-premium`}
              >
                <Text className="text-white text-base font-semibold text-center tracking-wide">
                  {confirmText}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
