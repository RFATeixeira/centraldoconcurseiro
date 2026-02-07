export default function GlassBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
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

      {/* Círculos decorativos */}
      <div className="absolute top-20 right-20 w-40 h-40 border border-cyan-500/20 rounded-full" />
      <div className="absolute bottom-40 left-40 w-60 h-60 border border-blue-500/15 rounded-full" />
      <div className="absolute top-1/3 left-1/2 w-32 h-32 border border-purple-500/10 rounded-full" />
      <div className="absolute bottom-1/2 right-1/3 w-48 h-48 border border-indigo-500/10 rounded-full" />

      {/* Pontos brilhantes */}
      <div
        className="absolute top-40 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping"
        style={{ animationDuration: '3s', animationDelay: '0s' }}
      />
      <div
        className="absolute bottom-60 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping"
        style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}
      />
      <div
        className="absolute top-2/3 right-1/4 w-2 h-2 bg-purple-400 rounded-full animate-ping"
        style={{ animationDuration: '4s', animationDelay: '1s' }}
      />
      <div
        className="absolute top-1/4 right-1/2 w-2 h-2 bg-cyan-300 rounded-full animate-ping"
        style={{ animationDuration: '3.2s', animationDelay: '1.5s' }}
      />
      <div
        className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-blue-300 rounded-full animate-ping"
        style={{ animationDuration: '3.8s', animationDelay: '2s' }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-2 h-2 bg-purple-300 rounded-full animate-ping"
        style={{ animationDuration: '3.3s', animationDelay: '0.8s' }}
      />
      <div
        className="absolute bottom-20 right-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-ping"
        style={{ animationDuration: '3.6s', animationDelay: '1.2s' }}
      />
      <div
        className="absolute top-60 left-1/5 w-2 h-2 bg-cyan-500 rounded-full animate-ping"
        style={{ animationDuration: '4.2s', animationDelay: '0.3s' }}
      />
      <div
        className="absolute bottom-1/4 left-2/3 w-2 h-2 bg-blue-500 rounded-full animate-ping"
        style={{ animationDuration: '3.4s', animationDelay: '1.8s' }}
      />
      <div
        className="absolute top-3/4 right-2/3 w-2 h-2 bg-purple-500 rounded-full animate-ping"
        style={{ animationDuration: '3.9s', animationDelay: '0.6s' }}
      />
    </div>
  )
}
