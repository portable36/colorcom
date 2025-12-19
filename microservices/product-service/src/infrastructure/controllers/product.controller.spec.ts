import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from '../../application/services/product.service';
import { RecommendationService } from '../../application/services/recommendation.service';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            createProduct: jest.fn(),
            getProduct: jest.fn(),
            listProducts: jest.fn(),
            searchProducts: jest.fn(),
            updateProduct: jest.fn(),
            deleteProduct: jest.fn(),
            getFeaturedProducts: jest.fn(),
            getTrendingProducts: jest.fn(),
            updateStock: jest.fn(),
          },
        },
        {
          provide: RecommendationService,
          useValue: {
            recommendForProduct: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'product-service');
    });
  });
});
