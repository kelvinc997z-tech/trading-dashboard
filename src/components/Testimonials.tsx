export default function Testimonials() {
  const testimonials = [
    {
      name: "Andi T.",
      role: "Retail Trader",
      text: "Klepon Market Research memberikan sinyal yang akurat dan mudah diikuti. P&L saya meningkat sejak pakai dashboard ini.",
    },
    {
      name: "Sarah W.",
      role: "Pro Account",
      text: "Advanced chart dan real-time data sangat membantu analisis teknikal. Highly recommended untuk trader serius.",
    },
    {
      name: "Budi K.",
      role: "HODLer",
      text: "Saya suka cara Market Outlook-nya — tidak sekadar data, tapi ada narasi yang jelas. Worth every penny.",
    },
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">What Traders Say</h2>
          <p className="text-gray-600 dark:text-gray-400">Testimonials dari komunitas kami</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
