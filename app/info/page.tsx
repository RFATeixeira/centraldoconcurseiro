export default function InfoPage() {
  return (
    <div className="max-w-4xl mx-auto my-auto h-full justify-center items-center z-150 relative flex flex-col p-6 gap-2">
      <h1 className="text-2xl font-bold mb-4">Informações</h1>
      <p className="mb-2 text-center">
        Central do Concurseiro - informações institucionais, termos de uso,
        política de privacidade e créditos.
      </p>
      <p className="text-center">
        Central do Concurseiro © 2026 - Todos os direitos reservados. Criado por
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
        privacidade do Brasil. Para dúvidas ou sugestões, entre em contato: (
        <a
          href="https://instagram.com/centraldc"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-cyan-400"
        >
          Instagram @centraldc
        </a>
        )
      </p>
      {/* Adicione mais informações conforme necessário */}
    </div>
  )
}
