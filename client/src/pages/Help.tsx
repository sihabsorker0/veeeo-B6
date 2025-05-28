
export default function Help() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Help Center</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Learn how to upload videos, create your channel, and engage with the community.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">FAQ</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">How do I upload a video?</h3>
              <p className="text-gray-600 dark:text-gray-400">Click the upload button in the top navigation bar to start sharing your content.</p>
            </div>
            <div>
              <h3 className="font-medium">How do I create a channel?</h3>
              <p className="text-gray-600 dark:text-gray-400">Sign up for an account and your channel will be automatically created.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Contact Support</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Need more help? Contact our support team for assistance.
          </p>
        </section>
      </div>
    </div>
  );
}
