import graphene
from users.schema import UserQuery, UserMutation
from core.schema import CoreQuery, CoreMutation


class Query(UserQuery, CoreQuery, graphene.ObjectType):
    pass


class Mutation(UserMutation, CoreMutation, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
