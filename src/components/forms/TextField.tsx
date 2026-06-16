import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface TextFieldProps<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function TextField<T extends FieldValues>({
  name,
  control,
  label,
  error,
  leftIcon,
  className,
  ...props
}: TextFieldProps<T>) {
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
              className={`w-full bg-white dark:bg-dark-card border ${
                error ? 'border-red-500' : 'border-light-border dark:border-dark-border'
              } rounded-xl py-3.5 pr-4 text-light-text dark:text-dark-text text-sm ${
                leftIcon ? 'pl-11' : 'pl-4'
              } shadow-sm`}
              placeholderTextColor="#94a3b8"
              {...props}
            />
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
