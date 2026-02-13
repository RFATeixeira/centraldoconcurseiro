const Footer = () => (
  <footer className="w-full bg-gray-900/10 backdrop-blur-xs text-gray-300 py-2 mt-12 z-200  border-t-2 border-gray-300/10">
    <div className="container mx-auto flex flex-col items-center justify-between gap-2 text-center text-xs">
      <div>
        <span>
          Central do Concurseiro © {new Date().getFullYear()} - Todos os
          direitos reservados.
        </span>
      </div>
      <div>
        <span>
          Criado por{' '}
          <a
            href="https://instragram.com/rfateixeira"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400"
          >
            Raphael Teixeira
          </a>
          . Este site está em conformidade com as leis de direitos autorais e
          privacidade do Brasil.
        </span>
      </div>
      <div>
        <span>
          Para dúvidas ou sugestões, entre em contato:{' '}
          <a
            href="https://instragram.com/sistema.cdc"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400"
          >
            ( Instagram @sistema.cdc )
          </a>
        </span>
      </div>
    </div>
  </footer>
)

export default Footer
