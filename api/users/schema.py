from django.contrib.auth import get_user_model

import graphene
from graphene_django.filter import DjangoFilterConnectionField
from graphene_django.types import DjangoObjectType

from api.permissions import IsAuthenticated


class UserNode(IsAuthenticated, DjangoObjectType):
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
        if info.context.user.is_anonymous:
            raise Exception('403: Unauthorized')

        return info.context.user


class UserMutation(graphene.ObjectType):
    pass
