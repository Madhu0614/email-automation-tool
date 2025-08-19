'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <Sidebar />

      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md text-center"
        >
          <div className="text-green-600 text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-green-700 mb-3">
            Campaign Launched Successfully!
          </h1>
          <p className="text-gray-700 mb-6">
            Your email campaign is now live and emails are being sent to your selected recipients.
          </p>

          <Button
            onClick={() => router.push('/campaigns')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            Go to Campaigns Dashboard
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
