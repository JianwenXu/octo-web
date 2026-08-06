export const summaryTestIds = {
    list: "summary-list",
    listSearch: "summary-list-search",
    listStatusFilter: "summary-list-status-filter",
    create: "summary-create",
    createEntry: "summary-create-entry",
    createTopic: "summary-create-topic",
    createSelectChat: "summary-create-select-chat",
    createSelectMembers: "summary-create-select-members",
    createSubmit: "summary-create-submit",
    card: (taskId: number) => `summary-card-${taskId}`,
    cardMenu: (taskId: number) => `summary-card-menu-${taskId}`,
    detail: (taskId: number) => `summary-detail-${taskId}`,
} as const;
