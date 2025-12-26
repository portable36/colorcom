import React from 'react'
import Link from 'next/link'
import { Card } from './Card'
import { Button } from './Button'
import { useWishlist } from '../lib/wishlist'

type Product = {
  id: string
  name: string
  price: number
  image?: string
  vendorId?: string
}

type Props = {
  product: Product
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const { items, add, remove } = useWishlist()
  const isWish = items.some((i) => i.id === product.id)

  function toggleWishlist() {
    if (isWish) remove(product.id)
    else add({ id: product.id, name: product.name, price: product.price, image: product.image })
  }

  return (
    <Card className="flex flex-col">
      <Link href={`/products/${product.id}`} className="block">
        <div className="h-40 bg-gray-100 rounded mb-4 flex items-center justify-center overflow-hidden">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
          ) : (
            <div className="text-gray-400">No image</div>
          )}
        </div>
      </Link>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <div className="text-gray-600">${product.price.toFixed(2)}</div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="primary" size="sm">Add to cart</Button>
        <Button aria-pressed={isWish} onClick={toggleWishlist} variant="ghost" size="sm" aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}>
          {isWish ? '♥ Wishlist' : '♡ Wishlist'}
        </Button>
      </div>
    </Card>
  )
}

export default ProductCard
