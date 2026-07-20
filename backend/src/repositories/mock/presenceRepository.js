/**
 * Repositório MOCK de presença (fluxo de pessoas por loja).
 * Trocar por ../api/presenceRepository.js quando a contagem real via câmeras
 * (API/IP) estiver disponível — mesma interface.
 */

const { presence } = require('../../data/seedPresence');

module.exports = {
  async getByStore(storeId) {
    return presence[storeId] ? JSON.parse(JSON.stringify(presence[storeId])) : null;
  },
  async list() {
    return JSON.parse(JSON.stringify(Object.values(presence)));
  },
};
