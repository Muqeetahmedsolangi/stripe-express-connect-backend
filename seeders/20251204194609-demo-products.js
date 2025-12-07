'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Products', [
      {
        name: 'iPhone 15 Pro Max',
        title: 'Latest Apple iPhone 15 Pro Max - 256GB',
        description: 'The most advanced iPhone ever with the best camera system, fastest chip, and longest battery life.',
        price: 1199.99,
        currency: 'USD',
        images: JSON.stringify([
          {
            url: 'https://example.com/iphone15.jpg',
            alt: 'iPhone 15 Pro Max',
            isPrimary: true
          }
        ]),
        sellerId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Nike Air Force 1',
        title: 'Nike Air Force 1 \'07 - White/White',
        description: 'The radiance lives on in the Nike Air Force 1 \'07, the b-ball icon that puts a fresh spin on what you know best.',
        price: 110.00,
        currency: 'USD',
        images: JSON.stringify([
          {
            url: 'https://example.com/airforce1.jpg',
            alt: 'Nike Air Force 1',
            isPrimary: true
          }
        ]),
        sellerId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'KitchenAid Stand Mixer',
        title: 'KitchenAid Artisan Series 5-Qt Stand Mixer',
        description: 'Professional-grade stand mixer perfect for baking and cooking enthusiasts.',
        price: 379.99,
        currency: 'USD',
        images: JSON.stringify([
          {
            url: 'https://example.com/kitchenaid.jpg',
            alt: 'KitchenAid Stand Mixer',
            isPrimary: true
          }
        ]),
        sellerId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Yoga Mat Premium',
        title: 'Premium Non-Slip Yoga Mat - 6mm Thick',
        description: 'High-quality yoga mat with superior grip and cushioning for all yoga practices.',
        price: 45.99,
        currency: 'USD',
        images: JSON.stringify([
          {
            url: 'https://example.com/yogamat.jpg',
            alt: 'Premium Yoga Mat',
            isPrimary: true
          }
        ]),
        sellerId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Organic Coffee Beans',
        title: 'Premium Organic Ethiopian Coffee Beans - 1lb',
        description: 'Single-origin Ethiopian coffee beans with rich flavor and aromatic profile.',
        price: 24.99,
        currency: 'USD',
        images: JSON.stringify([
          {
            url: 'https://example.com/coffee.jpg',
            alt: 'Organic Coffee Beans',
            isPrimary: true
          }
        ]),
        sellerId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Products', null, {});
  }
};