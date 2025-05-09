export default function Footer() {
  return (
    <footer className="w-full bg-gray-100 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <p className="text-center text-gray-600">
          © {new Date().getFullYear()} AI Interview Simulator. All rights reserved.
        </p>
      </div>
    </footer>
  );
}