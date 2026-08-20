// Silence console.warn in tests (expo-secure-store, peer dep warnings etc.)
global.console.warn = jest.fn();
global.console.error = jest.fn();
