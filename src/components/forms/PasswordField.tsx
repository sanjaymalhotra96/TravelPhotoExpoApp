import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, TextInputProps } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { Icons } from '../../theme';

interface PasswordFieldProps<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText' | 'secureTextEntry'> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function PasswordField<T extends FieldValues>({
  name,
  control,
  label,
  error,
  leftIcon,
  ...props
}: PasswordFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="w-full mb-4.5">
      {label && (
        <Text className="text-light-text dark:text-dark-text font-bold text-sm mb-1.5">
          {label}
        </Text>
      )}

      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View className="relative flex-row items-center w-full">
            {leftIcon && (
              <View className="absolute left-4 z-10">
                {leftIcon}
              </View>
            )}
            
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value || ''}
              secureTextEntry={!showPassword}
              className={`w-full bg-white dark:bg-dark-card border ${
                error ? 'border-red-500' : 'border-light-border dark:border-dark-border'
              } rounded-xl py-3.5 pr-12 text-light-text dark:text-dark-text text-sm ${
                leftIcon ? 'pl-11' : 'pl-4'
              } shadow-sm`}
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              {...props}
            />

            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4 p-1 active:opacity-60"
            >
              {showPassword ? (
                <Icons.EyeOff size={18} className="text-light-muted dark:text-dark-muted" />
              ) : (
                <Icons.Eye size={18} className="text-light-muted dark:text-dark-muted" />
              )}
            </Pressable>
          </View>
        )}
      />

      {error && (
        <Text className="text-red-500 text-xs mt-1.5 font-semibold">
          {error}
        </Text>
      )}
    </View>
  );
}
