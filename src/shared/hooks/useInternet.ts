import { useContext } from 'react';
import { InternetContext } from '@/shared/providers/InternetProvider';

export const useInternet = () => {
  const context = useContext(InternetContext);
  if (context === undefined) {
    throw new Error('useInternet must be used within an InternetProvider');
  }
  return context;
};
