import LegalLayout, { Section, InfoBox } from './LegalLayout';

const LIBRARIES = [
  {
    name: 'React',
    version: '18.x',
    license: 'MIT',
    url: 'https://github.com/facebook/react/blob/main/LICENSE',
    desc: 'JavaScript library for building user interfaces — used for the web frontend.',
  },
  {
    name: 'React Native',
    version: '0.74.x',
    license: 'MIT',
    url: 'https://github.com/facebook/react-native/blob/main/LICENSE',
    desc: 'Framework for building native mobile apps using React — used for the Android app.',
  },
  {
    name: 'Expo',
    version: '51.x',
    license: 'MIT',
    url: 'https://github.com/expo/expo/blob/main/LICENSE',
    desc: 'Open-source platform for universal native apps — used to build, test, and deploy the Android app.',
  },
  {
    name: 'Node.js',
    version: '20.x LTS',
    license: 'MIT',
    url: 'https://github.com/nodejs/node/blob/main/LICENSE',
    desc: 'JavaScript runtime for the server — used for the PulseMate backend API.',
  },
  {
    name: 'Express.js',
    version: '4.x',
    license: 'MIT',
    url: 'https://github.com/expressjs/express/blob/master/LICENSE',
    desc: 'Minimalist web framework for Node.js — used to build RESTful API routes.',
  },
  {
    name: 'Prisma ORM',
    version: '5.x',
    license: 'Apache 2.0',
    url: 'https://github.com/prisma/prisma/blob/main/LICENSE',
    desc: 'Next-generation Node.js ORM — used for database access and schema management.',
  },
  {
    name: 'PostgreSQL',
    version: '15.x',
    license: 'PostgreSQL License',
    url: 'https://www.postgresql.org/about/licence/',
    desc: 'Open-source relational database — used as the primary data store.',
  },
  {
    name: 'Socket.IO',
    version: '4.x',
    license: 'MIT',
    url: 'https://github.com/socketio/socket.io/blob/main/LICENSE',
    desc: 'Real-time bidirectional communication library — used for live queue updates.',
  },
  {
    name: 'Axios',
    version: '1.x',
    license: 'MIT',
    url: 'https://github.com/axios/axios/blob/main/LICENSE',
    desc: 'Promise-based HTTP client — used for API calls in the web and mobile app.',
  },
  {
    name: 'React Router DOM',
    version: '6.x',
    license: 'MIT',
    url: 'https://github.com/remix-run/react-router/blob/main/LICENSE.md',
    desc: 'Declarative routing for React web applications.',
  },
  {
    name: 'Tailwind CSS',
    version: '3.x',
    license: 'MIT',
    url: 'https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE',
    desc: 'Utility-first CSS framework — used for styling the web platform.',
  },
  {
    name: 'jsonwebtoken (JWT)',
    version: '9.x',
    license: 'MIT',
    url: 'https://github.com/auth0/node-jsonwebtoken/blob/master/LICENSE',
    desc: 'JSON Web Token implementation for Node.js — used for session authentication.',
  },
  {
    name: 'bcrypt',
    version: '5.x',
    license: 'MIT',
    url: 'https://github.com/kelektiv/node.bcrypt.js/blob/master/LICENSE',
    desc: 'Password hashing library — used to hash and verify user credentials.',
  },
  {
    name: 'Multer',
    version: '1.x',
    license: 'MIT',
    url: 'https://github.com/expressjs/multer/blob/master/LICENSE',
    desc: 'Middleware for handling multipart/form-data — used for file uploads.',
  },
  {
    name: 'Razorpay Node SDK',
    version: '2.x',
    license: 'MIT',
    url: 'https://github.com/razorpay/razorpay-node/blob/master/LICENSE',
    desc: 'Official Razorpay SDK for Node.js — used to create payment orders and verify signatures.',
  },
  {
    name: 'Vite',
    version: '5.x',
    license: 'MIT',
    url: 'https://github.com/vitejs/vite/blob/main/LICENSE',
    desc: 'Next-generation frontend build tool — used to build the React web app.',
  },
  {
    name: 'Zustand',
    version: '4.x',
    license: 'MIT',
    url: 'https://github.com/pmndrs/zustand/blob/main/LICENSE',
    desc: 'Lightweight state management for React — used for auth and app state.',
  },
  {
    name: 'react-hot-toast',
    version: '2.x',
    license: 'MIT',
    url: 'https://github.com/timolins/react-hot-toast/blob/main/LICENSE',
    desc: 'Notification library for React — used for success/error toast messages.',
  },
];

const LICENSE_COLORS = {
  'MIT': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  'Apache 2.0': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'PostgreSQL License': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

export default function OpenSourcePage() {
  return (
    <LegalLayout
      title="Open Source Notices"
      lastUpdated="July 17, 2026"
      toc={[
        { id: 'acknowledgement', label: 'Acknowledgement' },
        { id: 'libraries',       label: 'Libraries Used' },
        { id: 'licenses',        label: 'License Summary' },
      ]}
      subtitle="PulseMate Connect is built on the shoulders of amazing open source projects."
    >
      <Section title="Acknowledgement" id="acknowledgement">
        <p>PulseMate Connect is built using a number of open source software libraries and frameworks. We are deeply grateful to the developers and communities behind these projects for their contributions to the software ecosystem.</p>
        <p>This page lists the major open source dependencies used in the PulseMate Connect platform and their respective licences.</p>
        <InfoBox type="success">All open source libraries are used in compliance with their respective licence terms. PulseMate Connect does not modify the licenced source code of these libraries beyond standard configuration and usage.</InfoBox>
      </Section>

      <Section title="Libraries Used" id="libraries">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-3 text-slate-700 dark:text-slate-300 font-bold">Library</th>
                <th className="text-left py-3 px-3 text-slate-700 dark:text-slate-300 font-bold">Version</th>
                <th className="text-left py-3 px-3 text-slate-700 dark:text-slate-300 font-bold">Licence</th>
                <th className="text-left py-3 px-3 text-slate-700 dark:text-slate-300 font-bold hidden md:table-cell">Description</th>
              </tr>
            </thead>
            <tbody>
              {LIBRARIES.map((lib, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-3">
                    <a href={lib.url} target="_blank" rel="noopener noreferrer"
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      {lib.name}
                    </a>
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono">{lib.version}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LICENSE_COLORS[lib.license] || 'bg-slate-100 text-slate-600'}`}>
                      {lib.license}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">{lib.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="License Summary" id="licenses">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5">
            <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-2">MIT Licence</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">The MIT Licence is a permissive licence allowing use, copy, modify, merge, publish, distribute, sublicense, and sell. The only requirement is preserving the copyright notice.</p>
            <a href="https://opensource.org/licenses/MIT" className="text-xs text-blue-600 underline mt-2 block" target="_blank" rel="noopener noreferrer">Full text →</a>
          </div>
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5">
            <p className="font-bold text-blue-700 dark:text-blue-300 mb-2">Apache Licence 2.0</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Apache 2.0 allows use, modification, and distribution. It requires preserving copyright notices and includes an express patent grant from contributors.</p>
            <a href="https://www.apache.org/licenses/LICENSE-2.0" className="text-xs text-blue-600 underline mt-2 block" target="_blank" rel="noopener noreferrer">Full text →</a>
          </div>
          <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-5">
            <p className="font-bold text-purple-700 dark:text-purple-300 mb-2">PostgreSQL Licence</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">A liberal open source licence similar to BSD/MIT. Permits use, copy, modify, and distribution with copyright attribution.</p>
            <a href="https://www.postgresql.org/about/licence/" className="text-xs text-blue-600 underline mt-2 block" target="_blank" rel="noopener noreferrer">Full text →</a>
          </div>
        </div>
      </Section>
    </LegalLayout>
  );
}
