export const mockCrew = [
  {
    id: 'crw-001',
    userId: 'usr-c01',
    fullName: 'Rohan Sinha',
    role: 'Stage Operations',
    status: 'active',
    assignedEvents: ['evt-vol4'],
    tasks: [
      { id: 't1', label: 'Stage rig check', done: true },
      { id: 't2', label: 'Sound line walkthrough', done: false },
    ],
    schedule: [{ event: 'evt-vol4', callTime: '4:00 PM' }],
    createdAt: '2024-03-01T10:00:00Z',
  },
];
