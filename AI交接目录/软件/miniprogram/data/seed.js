const labs = require('../classrooms/index');
function createSeed(now = Date.now()) {
  return {
    schemaVersion: 1, revision: 0, nextId: 1, session: null,
    labs: JSON.parse(JSON.stringify(labs)),
    users: [
      { id: 'student', name: '张同学', role: 'student', labs: ['501', '502'], enabled: true },
      { id: 'teacher', name: '王老师', role: 'teacher', labs: ['501'], enabled: true },
      { id: 'admin', name: '林管理员', role: 'admin', labs: ['501', '502'], enabled: true }
    ],
    instruments: [
      { id: 'SEM-01', name: '扫描电子显微镜', labId: '501', model: 'SEM', status: 'active', needsApproval: true, requiresTraining: true, location: 'B区', safety: '需完成培训；按实验室规程准备样品。' },
      { id: 'XRD-02', name: 'X射线衍射仪', labId: '501', model: 'XRD', status: 'active', needsApproval: true, requiresTraining: false, location: 'A区', safety: '使用前阅读仪器说明并确认防护条件。' },
      { id: 'FTIR-03', name: '红外光谱仪', labId: '502', model: 'FTIR', status: 'maintenance', needsApproval: true, requiresTraining: false, location: 'C区', safety: '维护中，暂不开放预约。' }
    ],
    training: ['student', 'teacher', 'admin'].map(userId => ({ userId, instrumentId: 'SEM-01', expiresAt: now + 365 * 86400000 })),
    reagents: [
      { id: 'NACL-01', name: '氯化钠', labId: '502', batch: 'R20261001', stock: 18, unit: '瓶', specification: '500g/瓶', location: 'A柜01', expiry: '2028-10-01', threshold: 5, version: 1 },
      { id: 'PBS-01', name: '缓冲液', labId: '502', batch: 'R20261002', stock: 6, unit: '瓶', specification: '500mL/瓶', location: 'B柜01', expiry: '2026-11-02', threshold: 3, version: 1 }
    ],
    bookings: [], samples: [], reagentLogs: [], notifications: [], logs: [], requestKeys: []
  };
}
module.exports = { createSeed };

