import React from 'react'
import ProductCard from '../components/ProductCard'

const demoProduct = { id: 'demo-1', name: 'Demo Product', price: 19.99 }

export default function ComponentsDemo() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Components Demo</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProductCard product={demoProduct} />
        <ProductCard product={{...demoProduct, id: 'demo-2', name: 'Another Product', price: 29.99}} />
        <ProductCard product={{...demoProduct, id: 'demo-3', name: 'Third Product', price: 9.99}} />
      </div>
    </main>
  )
}
