import { NumericFormat, type NumericFormatProps } from 'react-number-format'

export interface InputMoedaProps extends Omit<NumericFormatProps, 'value' | 'onValueChange'> {
  /** Valor numérico (ex.: 1234.56). Envio à API: número puro. */
  value: number | ''
  /** Callback com o valor numérico (float). */
  onValueChange: (value: number | undefined) => void
}

/**
 * Campo de valor monetário pt-BR (R$ 1.234,56).
 * Especificação F3F-componentes: react-number-format, prefix R$, milhar ".", decimal ",".
 */
export default function InputMoeda({
  value,
  onValueChange,
  id,
  placeholder = '0,00',
  disabled,
  className = '',
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  ...rest
}: InputMoedaProps) {
  return (
    <NumericFormat
      id={id}
      value={value === '' ? '' : value}
      onValueChange={(values) => onValueChange(values.floatValue)}
      prefix="R$ "
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedby}
      {...rest}
    />
  )
}
