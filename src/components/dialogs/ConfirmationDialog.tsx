import React from 'react';
import { View, Text, Modal } from 'react-native';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';

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
  confirmText = 'Confirm',
  cancelText = 'Cancel',
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
              <SecondaryButton onPress={onCancel} title={cancelText} />
            </View>
            <View className="w-[47%]">
              <PrimaryButton
                onPress={onConfirm}
                title={confirmText}
                variant={confirmVariant}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
