type WppConfig = {
  disableGoogleAnalytics?: boolean;
  poweredBy?: string | null;
};

const pageWindow = window as Window & { WPPConfig?: WppConfig };

pageWindow.WPPConfig = {
  ...pageWindow.WPPConfig,
  disableGoogleAnalytics: true,
  poweredBy: null,
};

export {};
