# React Query Migration Guide

## ✅ Completed Work

### 1. **Centralized API Client** (`/src/lib/api/client.ts`)
Created axios instances with proper configuration:
- `adminApi` - Admin endpoints (`/api/admin/*`)
- `blogApi` - Blog endpoints (`/api/blog/*`)
- `userApi` - User settings (`/api/user/*`)
- `notificationsApi` - Notifications (`/api/notifications/*`)
- `watchRoomApi` - Watch rooms (`/api/watch-room/*`)
- `apiClient` - Generic API calls

**Features:**
- 30s timeout
- Automatic error handling
- Type-safe response wrapper
- Retry logic via React Query

### 2. **React Query Hooks Created**

#### Admin Hooks (`/src/lib/hooks/useAdmin.ts`)
- `useStatsOverview()` - Dashboard stats
- `useUsers(page, search)` - User list with pagination
- `useDeleteUser()` - Delete user mutation
- `useUpdateUserBanStatus()` - Ban/unban users
- `useContentSources()` - Video sources
- `useUpdateContentSource()` - Toggle source status
- `useTestContentSource()` - Test source health
- `useWatchRooms()` - Active watch rooms
- `useDeleteWatchRoom()` - Delete room
- `useAnalytics()` - Analytics data
- `useAdminNotifications()` - Admin notifications
- `useUnreadNotificationsCount()` - Unread count
- `useCreateAdminNotification()` - Create notification
- `useDeleteAdminNotification()` - Delete notification
- `useAdminSettings()` - General settings
- `useSystemSettings()` - System info
- `useUpdateAdminSettings()` - Update settings
- `useRecentActivity()` - Recent activity feed

#### Blog Hooks (`/src/lib/hooks/useBlog.ts`)
- `useBlogPosts(page, status, search)` - Blog list
- `useBlogPost(id)` - Single post
- `useCreateBlogPost()` - Create post
- `useUpdateBlogPost()` - Update post
- `useDeleteBlogPost()` - Delete post
- `usePublishBlogPost()` - Publish
- `useUnpublishBlogPost()` - Unpublish
- `useBlogLikes(slug)` - Get likes
- `useToggleBlogLike(slug)` - Like/unlike
- `useBlogComments(slug)` - Get comments
- `useCreateBlogComment(slug)` - Add comment
- `useGenerationStatus()` - Auto-gen status (2s polling when running)
- `useStartGeneration()` - Start auto-gen
- `useStopGeneration()` - Stop auto-gen
- `useBlogGenerationProgress()` - Progress tracking
- `useResetBlogProgress()` - Reset progress

#### Notification Hooks (`/src/lib/hooks/useNotifications.ts`)
- `useNotifications()` - Get all notifications
- `useUnreadNotificationsCount()` - Unread count (1min polling)
- `useMarkNotificationAsRead()` - Mark single as read
- `useMarkAllNotificationsAsRead()` - Mark all read
- `useDeleteNotification()` - Delete notification
- `useClearAllNotifications()` - Clear all
- `useSendInviteNotification()` - Send invite

#### Watch Room Hooks (`/src/lib/hooks/useWatchRoom.ts`)
- `useWatchRoom(code)` - Get room details
- `useCreateWatchRoom()` - Create room
- `useSearchUsers(query)` - Search users (min 2 chars)

#### User Settings Hooks (`/src/lib/hooks/useUserSettings.ts`)
- `useAISettings()` - Get AI settings
- `useUpdateAISettings()` - Update AI settings

### 3. **Migrated Components/Pages**

✅ **Admin Pages:**
- `/src/app/admin/page.tsx` - Dashboard
- `/src/app/admin/users/page.tsx` - User management
- `/src/app/admin/content/page.tsx` - Content sources

✅ **Components:**
- `/src/components/NotificationBell.tsx` - Notifications dropdown

## 🔄 Migration Pattern

### Before (Old Pattern):
```typescript
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MyPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/api/some-endpoint');
                setData(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpdate = async (id: string) => {
        try {
            await axios.patch(`/api/some-endpoint/${id}`, { data });
            // Manually refetch
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    return <div>{/* ... */}</div>;
}
```

### After (New Pattern):
```typescript
'use client';

import { useSomeData, useUpdateSomeData } from '@/lib/hooks/useSomeHook';

export default function MyPage() {
    // Query with automatic caching, retry, error handling
    const { data, isLoading, error } = useSomeData();

    // Mutation with automatic cache invalidation
    const updateMutation = useUpdateSomeData();

    const handleUpdate = (id: string) => {
        updateMutation.mutate(id);
        // Cache automatically updated!
    };

    return <div>{/* ... */}</div>;
}
```

## 📋 TODO: Remaining Migrations

### High Priority:
1. **Blog Admin Pages:**
   - `/src/app/admin/blog/page.tsx` - Use `useBlogPosts`, `useDeleteBlogPost`, `usePublishBlogPost`, `useUnpublishBlogPost`
   - `/src/app/admin/blog/new/page.tsx` - Use `useCreateBlogPost`, `usePublishBlogPost`
   - `/src/app/admin/blog/[id]/edit/page.tsx` - Use `useBlogPost`, `useUpdateBlogPost`

2. **Blog Auto-Generate:**
   - `/src/app/admin/blog/auto-generate/page.tsx` - Use `useGenerationStatus`, `useStartGeneration`, `useStopGeneration`, `useAISettings`

3. **AI Settings:**
   - `/src/app/admin/settings/ai/page.tsx` - Use `useAISettings`, `useUpdateAISettings`

4. **Blog Components:**
   - `/src/components/blog/BlogPostClient.tsx` - Use `useBlogLikes`, `useToggleBlogLike`, `useBlogComments`, `useCreateBlogComment`
   - `/src/components/admin/BlogGenerationProgress.tsx` - Use `useBlogGenerationProgress`, `useResetBlogProgress`

5. **Watch Together:**
   - `/src/components/WatchTogetherModal.tsx` - Use `useCreateWatchRoom`, `useSearchUsers`, `useSendInviteNotification`

### Medium Priority:
6. **Admin Pages:**
   - `/src/app/admin/rooms/page.tsx` - Use `useWatchRooms`, `useDeleteWatchRoom`
   - `/src/app/admin/analytics/page.tsx` - Use `useAnalytics`
   - `/src/app/admin/notifications/page.tsx` - Use `useAdminNotifications`, `useCreateAdminNotification`, `useDeleteAdminNotification`
   - `/src/app/admin/settings/page.tsx` - Use `useAdminSettings`, `useSystemSettings`, `useUpdateAdminSettings`

7. **Admin Components:**
   - `/src/components/admin/RecentActivity.tsx` - Use `useRecentActivity`
   - `/src/components/admin/AdminHeader.tsx` - Use `useUnreadNotificationsCount`

## 🎯 Benefits Achieved

1. **Automatic Caching** - Data cached with smart stale times
2. **Background Refetching** - Auto-refresh on intervals
3. **Optimistic Updates** - Instant UI updates
4. **Error Retry** - Exponential backoff retry logic
5. **Loading States** - Built-in `isLoading`, `isFetching`
6. **Type Safety** - Full TypeScript support
7. **DevTools** - React Query DevTools available
8. **Less Boilerplate** - No more manual state management
9. **Automatic Invalidation** - Mutations invalidate queries
10. **Request Deduplication** - Multiple calls = 1 request

## 🚀 Query Configuration

### Current Settings (in `QueryProvider.tsx`):
```typescript
{
  queries: {
    staleTime: 1000 * 60 * 30,      // 30 minutes
    gcTime: 1000 * 60 * 60,         // 1 hour
    retry: 2,                        // 2 retries
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
  mutations: {
    retry: 1,
  },
}
```

### Custom Configurations:
- **Generation Status**: 0ms stale time, 2s polling when running
- **Notifications**: 30s stale time, 1min polling
- **Stats**: 5min stale time
- **Users**: 2min stale time
- **Rooms**: 1min stale time (frequently changing)

## 📖 Usage Examples

### Simple Query:
```typescript
const { data, isLoading, error, refetch } = useUsers();

if (isLoading) return <Spinner />;
if (error) return <Error message={error.message} />;
return <UserList users={data.users} />;
```

### Query with Params:
```typescript
const { data } = useBlogPosts(page, 'published', searchQuery);
```

### Mutation:
```typescript
const deleteUser = useDeleteUser();

const handleDelete = (id: string) => {
  deleteUser.mutate(id, {
    onSuccess: () => toast.success('Deleted!'),
    onError: (err) => toast.error(err.message),
  });
};
```

### Polling:
```typescript
// Status automatically polls every 2s when running
const { data: status } = useGenerationStatus();
```

### Conditional Fetching:
```typescript
const { data } = useBlogPost(postId, { enabled: !!postId });
```

### Manual Invalidation:
```typescript
const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: blogKeys.posts() });

// Invalidate all blog queries
queryClient.invalidateQueries({ queryKey: blogKeys.all });
```

## 🔍 Query Keys Structure

All keys follow hierarchical pattern:
```typescript
['admin'] - All admin queries
['admin', 'users'] - All user queries
['admin', 'users', 'list', page, search] - Specific user list

['blog'] - All blog queries
['blog', 'posts'] - All posts
['blog', 'posts', 'detail', id] - Specific post
['blog', 'likes', slug] - Likes for post
```

This allows:
- Invalidate all admin: `adminKeys.all`
- Invalidate all users: `adminKeys.users()`
- Invalidate specific list: `adminKeys.usersList(page, search)`

## 💡 Best Practices

1. **Always use hooks** - Don't call API directly
2. **Export types** - Export interfaces from hook files
3. **Use query keys** - Use key constants for invalidation
4. **Handle errors** - Show error states in UI
5. **Optimistic updates** - Update UI before mutation completes
6. **Cache invalidation** - Invalidate related queries after mutations
7. **Loading states** - Use `isLoading` and `isFetching` appropriately
8. **Enable conditionally** - Use `enabled` option when needed
9. **Custom stale times** - Adjust per query needs
10. **DevTools** - Use React Query DevTools for debugging

## 🎨 UI Patterns

### Loading State:
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );
}
```

### Error State:
```typescript
if (error) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
      <p className="text-red-400">{error.message}</p>
      <button onClick={() => refetch()}>Retry</button>
    </div>
  );
}
```

### Mutation Loading:
```typescript
<button 
  disabled={mutation.isPending}
  onClick={() => mutation.mutate(data)}
>
  {mutation.isPending ? 'Saving...' : 'Save'}
</button>
```

## 📚 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Query Key Factory Pattern](https://tkdodo.eu/blog/effective-react-query-keys)
- [Mutations Guide](https://tanstack.com/query/latest/docs/react/guides/mutations)
