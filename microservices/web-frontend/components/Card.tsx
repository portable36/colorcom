import React from 'react'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`rounded bg-white shadow-sm p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Card
