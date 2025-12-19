import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client;

  constructor(private configService: ConfigService) {
    this.client = new Client({
      node: this.configService.get('ELASTICSEARCH_URL') || 'http://localhost:9200',
    });
  }

  /**
   * Index a product in Elasticsearch for full-text search
   */
  async indexProduct(product: any): Promise<void> {
    try {
      const index = `products_${product.tenantId}`;
      
      const tags = product.productTags ? (product.productTags.map((pt: any) => pt.tag?.name).filter(Boolean)) : product.tags;
      const categoryName = product.categoryRef ? product.categoryRef.name : product.category;
      const attributes = product.attributes ? product.attributes.map((a: any) => ({ name: a.attribute?.name, value: a.value })) : [];

      await this.client.index({
        index,
        id: product.id,
        document: {
          id: product.id,
          tenantId: product.tenantId,
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: categoryName,
          subCategory: product.subCategory,
          tags: tags,
          attributes: attributes,
          price: product.price,
          rating: product.rating,
          status: product.status,
          featured: product.featured,
          trending: product.trending,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });

      this.logger.debug(`Product indexed: ${product.id} in index: ${index}`);
    } catch (error: any) {
      this.logger.error(`Failed to index product: ${error?.message || 'Unknown error'}`);
      // Don't throw - indexing failures shouldn't block product creation
    }
  }

  /**
   * Update product in Elasticsearch
   */
  async updateProduct(product: any): Promise<void> {
    try {
      const index = `products_${product.tenantId}`;
      
      const tags = product.productTags ? (product.productTags.map((pt: any) => pt.tag?.name).filter(Boolean)) : product.tags;
      const categoryName = product.categoryRef ? product.categoryRef.name : product.category;
      const attributes = product.attributes ? product.attributes.map((a: any) => ({ name: a.attribute?.name, value: a.value })) : [];

      await this.client.update({
        index,
        id: product.id,
        doc: {
          name: product.name,
          description: product.description,
          category: categoryName,
          price: product.price,
          rating: product.rating,
          status: product.status,
          tags,
          attributes,
          updatedAt: product.updatedAt,
        },
      });

      this.logger.debug(`Product updated in Elasticsearch: ${product.id}`);
    } catch (error: any) {
      this.logger.warn(`Failed to update product in Elasticsearch: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Delete product from Elasticsearch
   */
  async deleteProduct(productId: string, tenantId?: string): Promise<void> {
    try {
      const index = tenantId ? `products_${tenantId}` : 'products_*';
      
      await this.client.delete({
        index,
        id: productId,
      });

      this.logger.debug(`Product deleted from Elasticsearch: ${productId}`);
    } catch (error: any) {
      this.logger.warn(`Failed to delete product from Elasticsearch: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Full-text search products
   */
  async search(searchParams: {
    tenantId: string;
    query: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    skip?: number;
    take?: number;
  }) {
    try {
      const index = `products_${searchParams.tenantId}`;
      const skip = searchParams.skip || 0;
      const take = searchParams.take || 20;

      const filters: any[] = [
        { term: { tenantId: searchParams.tenantId } },
        { term: { status: 'ACTIVE' } },
      ];

      if (searchParams.category) {
        filters.push({ term: { category: searchParams.category } });
      }

      if (searchParams.minPrice !== undefined) {
        filters.push({ range: { price: { gte: searchParams.minPrice } } });
      }

      if (searchParams.maxPrice !== undefined) {
        filters.push({ range: { price: { lte: searchParams.maxPrice } } });
      }

      const response = await this.client.search({
        index,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchParams.query,
                  fields: ['name^3', 'description', 'tags', 'category'],
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: filters,
          },
        },
        from: skip,
        size: take,
        sort: [
          { _score: { order: 'desc' } },
          { rating: { order: 'desc' } },
          { createdAt: { order: 'desc' } },
        ],
      });

      const hits = response.hits.hits.map((hit: any) => ({
        ...hit._source,
        score: hit._score,
      }));

      return {
        data: hits,
        total: typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0,
        skip,
        take,
      };
    } catch (error: any) {
      this.logger.error(`Search failed: ${error?.message || 'Unknown error'}`);
      return { data: [], total: 0, skip: searchParams.skip || 0, take: searchParams.take || 20 };
    }
  }

  /**
   * Autocomplete suggestions
   */
  async suggest(tenantId: string, prefix: string): Promise<string[]> {
    try {
      const index = `products_${tenantId}`;

      const response = await this.client.search({
        index,
        query: {
          bool: {
            must: [
              {
                match_phrase_prefix: {
                  name: {
                    query: prefix,
                  },
                },
              },
            ],
            filter: [{ term: { status: 'ACTIVE' } }],
          },
        },
        size: 10,
        _source: ['name'],
      });

      const suggestions = Array.from(new Set(
        response.hits.hits.map((hit: any) => hit._source.name),
      ));

      return suggestions as string[];
    } catch (error: any) {
      this.logger.warn(`Autocomplete failed: ${error?.message || 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Get search stats for a tenant
   */
  async getStats(tenantId: string): Promise<any> {
    try {
      const index = `products_${tenantId}`;

      const response = await this.client.search({
        index,
        size: 0,
        aggs: {
          categories: {
            terms: { field: 'category.keyword', size: 100 },
          },
          priceRange: {
            stats: { field: 'price' },
          },
          statusDistribution: {
            terms: { field: 'status' },
          },
        },
      });

      return response.aggregations;
    } catch (error: any) {
      this.logger.warn(`Failed to get stats: ${error?.message || 'Unknown error'}`);
      return null;
    }
  }
}
