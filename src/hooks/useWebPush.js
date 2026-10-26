import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para gerenciar permissão e registro de Notificações Web Push (HTML5 / PWA)
 */
export function useWebPush(user, bills = []) {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  /**
   * Solicita permissão ao usuário para enviar notificações
   */
  const requestPermission = async () => {
    if (!isSupported) {
      alert('Notificações não são suportadas neste navegador.');
      return false;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Dispara uma notificação de boas-vindas / teste imediata
        showLocalNotification(
          '🔔 Notificações Ativadas!',
          'O FiscalZap avisará você automaticamente nas datas de vencimento dos seus boletos.'
        );

        // Se houver contas vencendo hoje, já alerta na hora
        checkAndNotifyTodayBills();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao pedir permissão de push:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exibe uma notificação local via Service Worker
   */
  const showLocalNotification = async (title, body) => {
    if (Notification.permission !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        data: { url: '/mobile' }
      });
    } catch (err) {
      // Fallback para API nativa direta caso SW não responda
      new Notification(title, { body, icon: '/favicon.svg' });
    }
  };

  /**
   * Verifica contas vencendo na data de hoje e emite o alerta ativo
   */
  const checkAndNotifyTodayBills = () => {
    if (!bills || bills.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = bills.filter(b => b.date === todayStr);

    if (todayBills.length > 0) {
      const total = todayBills.reduce((acc, b) => acc + Number(b.amount), 0);
      showLocalNotification(
        '⚠️ Atenção aos Vencimentos de Hoje!',
        `Você possui ${todayBills.length} conta(s) empresarial(is) vencendo hoje, totalizando R$ ${total.toFixed(2).replace('.', ',')}. Toque para pagar.`
      );
    }
  };

  return {
    permission,
    isSupported,
    loading,
    requestPermission,
    showLocalNotification,
    checkAndNotifyTodayBills
  };
}
