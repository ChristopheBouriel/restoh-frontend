import { test as teardown } from '@playwright/test';

teardown('cleanup', async () => {
  // Placeholder pour le cleanup global si nécessaire
  // Par exemple : supprimer les données de test créées pendant les tests
  console.log('Global teardown completed');
});
