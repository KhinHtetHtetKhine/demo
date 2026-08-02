export const inventoryLocators = {
  inventoryContainer: '[data-test="inventory-container"]',
  inventoryItem:      '[data-test="inventory-item"]',
  itemName:           '[data-test="inventory-item-name"]',
  itemPrice:          '[data-test="inventory-item-price"]',
  addToCartButton:    '[data-test^="add-to-cart"]',
  cartBadge:          '[data-test="shopping-cart-badge"]',
  cartLink:           '[data-test="shopping-cart-link"]',
  menuButton:         '#react-burger-menu-btn',
  logoutLink:         '[data-test="logout-sidebar-link"]',
} as const;
