// components/UserList.tsx
interface User {
  id: string;
  name: string;
}

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Registered Users
        </h3>
        <div className="mt-4">
          {!users || users.length === 0 ? (
            <p className="text-gray-500">No users registered yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500">
                        <span className="text-lg font-medium leading-none text-white">
                          {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        ID: {user?.id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <button
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={() => {
                          console.log('Delete user:', user.id);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}