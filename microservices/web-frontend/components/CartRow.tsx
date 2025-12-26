import React from 'react'
import { CartItem } from '../lib/cart'
import { fetchProduct } from '../lib/api'

export default function CartRow({ item, updateQuantity, removeItem, updateItemOptions }: { item: CartItem; updateQuantity: (id:string,qty:number)=>void; removeItem:(id:string)=>void; updateItemOptions:(id:string,opts?:Record<string,string>,price?:number)=>void }) {
  const [product, setProduct] = React.useState<any>(null)
  const [selected, setSelected] = React.useState<string | null>(item.options?.variant || null)

  React.useEffect(() => {
    fetchProduct(item.productId).then(setProduct).catch(()=>{})
  }, [item.productId])

  function onSelectChange(v: string) {
    setSelected(v)
    const variation = product?.variations?.find((x:any)=>x.id===v)
    const price = variation ? Math.round((product.price + (variation.priceDelta||0))*100)/100 : item.price
    updateItemOptions(item.id, variation ? { variant: variation.label } : undefined, price)
  }

  return (
    <li className="border p-3 rounded flex justify-between items-center">
      <div>
        <div className="font-medium">{item.name}</div>
        {product?.variations?.length > 0 && (
          <div className="mt-2">
            <label className="text-sm block">Variant</label>
            <select value={selected || ''} onChange={(e)=>onSelectChange(e.target.value)} className="border rounded px-2 py-1 mt-1">
              <option value="">Default</option>
              {product.variations.map((v:any)=> <option key={v.id} value={v.id}>{v.label} {v.priceDelta?`(+ $${v.priceDelta})`:''}</option>)}
            </select>
          </div>
        )}
        {item.options && <div className="text-sm text-gray-600 mt-2">{Object.entries(item.options).map(([k,v])=> <div key={k}>{k}: {v}</div>)}</div>}
        <div className="text-sm text-gray-600 mt-2">${item.price} × {item.quantity}</div>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" min={1} value={item.quantity} onChange={(e)=>updateQuantity(item.id, Number(e.target.value))} className="w-20 border rounded px-2 py-1" />
        <button className="text-red-600" onClick={()=>removeItem(item.id)}>Remove</button>
      </div>
    </li>
  )
}
