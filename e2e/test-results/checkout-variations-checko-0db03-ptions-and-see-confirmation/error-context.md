# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - heading "Colorcom Storefront" [level=1] [ref=e6]: Colorcom
        - navigation "Main navigation" [ref=e7]:
          - link "Products" [ref=e8] [cursor=pointer]:
            - /url: /products
          - link "Search" [ref=e9] [cursor=pointer]:
            - /url: /search
          - link "Wishlist" [ref=e10] [cursor=pointer]:
            - /url: /wishlist
          - link "Account" [ref=e11] [cursor=pointer]:
            - /url: /account
          - link "Cart, 1 items" [ref=e12] [cursor=pointer]:
            - /url: /cart
            - text: Cart (1)
    - main [ref=e13]:
      - heading "Order confirmation" [level=1] [ref=e14]
      - generic [ref=e15]:
        - generic [ref=e16]: "Order ID: cmjlu24sx0028tw3fg1eu2tf9"
        - generic [ref=e17]: "Total: $28.09"
        - generic [ref=e18]:
          - heading "Items" [level=2] [ref=e19]
          - list [ref=e20]:
            - listitem [ref=e21]:
              - generic [ref=e22]: Red T-Shirt — $21.99 × 1
    - contentinfo [ref=e23]: © Colorcom — Built for demo purposes
  - alert [ref=e24]
```