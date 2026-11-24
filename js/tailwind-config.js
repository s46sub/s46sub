if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'system-ui', 'sans-serif'],
          mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
        },
        colors: {
          accent: {
            50: '#fff1f0',
            100: '#ffccc7',
            500: '#F53F3F',
            600: '#E02E2E',
            700: '#C41D1D'
          },
          cinema: {
            900: '#0F1115',
            800: '#181B22',
            700: '#232730'
          }
        }
      }
    }
  };
}
