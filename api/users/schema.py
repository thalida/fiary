from django.contrib.auth import get_user_model

import graphene
from graphene_django.filter import DjangoFilterConnectionField
from graphene_django.types import DjangoObjectType


class UserNode(DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta():
        model = get_user_model()
        filter_fields = ["username"]
        exclude = ["email", "password"]
        interfaces = (graphene.relay.Node, )


class UserQuery(graphene.ObjectType):
    user = graphene.relay.Node.Field(UserNode)
    users = DjangoFilterConnectionField(UserNode)
    me = graphene.Field(UserNode)

    def resolve_me(self, info):
        user = info.context.user
        if user.is_authenticated:
            return user
        return None


class UserMutation(graphene.ObjectType):
    pass
