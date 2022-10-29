import graphene
from users.schema import UserQuery, UserMutation
from fiary.schema import FiaryQuery, FiaryMutation


class Query(UserQuery, FiaryQuery, graphene.ObjectType):
    pass


class Mutation(UserMutation, FiaryMutation, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
