import { apiClient, formatApiError } from './apiClient';
import type { QueueItem, QueueResponse, AcuityCategory } from '../types/api';

export interface QueueService {
  getQueue(t: (key: string) => string): Promise<QueueResponse>;
  refreshQueue(t: (key: string) => string): Promise<QueueResponse>;
}

export const realQueueService: QueueService = {
  async getQueue(t) {
    try {
      return await apiClient.get<QueueResponse>('/api/queue');
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },

  async refreshQueue(t) {
    try {
      // Add cache-busting parameter
      return await apiClient.get<QueueResponse>(`/api/queue?_=${Date.now()}`);
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },
};

// Queue filter types
export type QueueFilter = 'all' | 'red' | 'yellow' | 'green' | 'needs_review';

// Filter queue items
export function filterQueue(items: QueueItem[], filter: QueueFilter): QueueItem[] {
  switch (filter) {
    case 'red':
      return items.filter(item => item.acuity === 'red');
    case 'yellow':
      return items.filter(item => item.acuity === 'yellow');
    case 'green':
      return items.filter(item => item.acuity === 'green');
    case 'needs_review':
      return items.filter(item => item.review_status === 'pending');
    case 'all':
    default:
      return items;
  }
}

// Sort queue items by acuity priority (red first, then yellow, then green)
export function sortQueueByAcuity(items: QueueItem[]): QueueItem[] {
  const acuityPriority: Record<AcuityCategory, number> = {
    red: 0,
    yellow: 1,
    green: 2,
  };

  return [...items].sort((a, b) => {
    // First sort by acuity
    const acuityDiff = acuityPriority[a.acuity] - acuityPriority[b.acuity];
    if (acuityDiff !== 0) return acuityDiff;

    // Then by waiting time (longer waiting first)
    return b.waiting_duration_seconds - a.waiting_duration_seconds;
  });
}

// Get summary counts
export function getQueueSummary(items: QueueItem[]) {
  return {
    total: items.length,
    red: items.filter(i => i.acuity === 'red').length,
    yellow: items.filter(i => i.acuity === 'yellow').length,
    green: items.filter(i => i.acuity === 'green').length,
    needsReview: items.filter(i => i.review_status === 'pending').length,
  };
}