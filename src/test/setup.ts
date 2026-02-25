import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';

// Configuração básica do MSW será feita nos arquivos de teste específicos
// ou aqui se houver handlers globais.
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
