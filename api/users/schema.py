import graphene
from graphene_django.filter import DjangoFilterConnectionField
from graphene_django.types import DjangoObjectType
import graphql_jwt
from api.permissions import IsAuthenticated
from .models import User


class UserNode(IsAuthenticated, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta():
        model = User
        filter_fields = ["username"]
        exclude = ["email", "password"]
        interfaces = (graphene.relay.Node, )


class Register(graphene.relay.ClientIDMutation):
    class Input:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        password2 = graphene.String(required=True)

    user = graphene.Field(UserNode)

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        if input['password'] != input['password2']:
            raise Exception('Passwords must match')

        user = User.objects.create(
            username=input['username'],
            email=input['email']
        )
        user.set_password(input['password'])
        user.save()

        return Register(user=user)


class UserQuery(graphene.ObjectType):
    user = graphene.relay.Node.Field(UserNode)
    users = DjangoFilterConnectionField(UserNode)
    me = graphene.Field(UserNode)

    def resolve_me(self, info):
        if info.context.user.is_anonymous:
            raise Exception('403: Unauthorized')

        return info.context.user


class UserMutation(graphene.ObjectType):
    token_auth = graphql_jwt.relay.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.relay.Verify.Field()
    refresh_token = graphql_jwt.relay.Refresh.Field()
    register = Register.Field()
