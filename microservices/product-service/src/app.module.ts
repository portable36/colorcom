import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { ProductController } from './infrastructure/controllers/product.controller';
import { WebhookController } from './infrastructure/controllers/webhook.controller';
import { CategoryController } from './infrastructure/controllers/category.controller';
import { TagController } from './infrastructure/controllers/tag.controller';
import { AttributeController } from './infrastructure/controllers/attribute.controller';
import { ProductService } from './application/services/product.service';
import { PrismaService } from './infrastructure/database/prisma.service';
import { ElasticsearchService } from './infrastructure/search/elasticsearch.service';
import { CacheService } from './infrastructure/cache/cache.service';
import { WebhookService } from './infrastructure/webhooks/webhook.service';
import { ProductResolver } from './graphql/product.resolver';
import { RecommendationService } from './application/services/recommendation.service';
import { AnalyticsService } from './application/services/analytics.service';
import { ReportsController } from './infrastructure/controllers/reports.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      sortSchema: true,
      playground: true,
    }),
  ],
  controllers: [ProductController, WebhookController, ReportsController, CategoryController, TagController, AttributeController],
  providers: [ProductService, PrismaService, ElasticsearchService, CacheService, WebhookService, ProductResolver, RecommendationService, AnalyticsService],
})
export class AppModule {}
