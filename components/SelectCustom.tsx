import React, { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'

interface SelectCustomProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
  widthClass?: string
}

export default function SelectCustom({
  value,
  onChange,
  options,
  className = '',
  widthClass = 'w-full md:w-56',
}: SelectCustomProps) {
  return (
    <div className={widthClass}>
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button
            className={`relative w-full cursor-pointer rounded-3xl bg-black/20 py-2 pl-4 pr-10 text-left text-white0 font-semibold border-2 border-white/20 shadow-lg focus:outline-none focus:ring-0 transition-all ${className}`}
          >
            <span className="block truncate">
              {options.find((opt) => opt.value === value)?.label ||
                options[0]?.label}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon
                className="h-5 w-5 text-white"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-3xl bg-black/40 backdrop-blur-xs py-1 text-base shadow-lg ring-2 ring-white/20 focus:outline-none">
              {options.map((opt) => (
                <Listbox.Option
                  key={opt.value}
                  className={({ active }: { active: boolean }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-cyan-700/30 text-white' : 'text-white'}`
                  }
                  value={opt.value}
                >
                  {({ selected }: { selected: boolean }) => (
                    <>
                      <span
                        className={`block truncate ${selected ? 'font-bold' : ''}`}
                      >
                        {opt.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyan-300">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}
