export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgb(3, 7, 18) 0%, rgb(17, 24, 39) 50%, rgb(0, 0, 0) 100%)',
        }}
      >
        {/* Grade de linhas */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
            linear-gradient(90deg, rgba(6,182,212,0.15) 1px, transparent 1px),
            linear-gradient(rgba(6,182,212,0.15) 1px, transparent 1px)
          `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Linhas diagonais */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 35px,
              rgba(6,182,212,0.1) 35px,
              rgba(6,182,212,0.1) 36px
            )
          `,
          }}
        />
      </div>

      {/* Spinner */}
      <div className="relative z-10">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    </div>
  )
}
