from ast import pattern
import graphene
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField

from .models import Room, Bookshelf, Notebook, Page, Element


class RoomNode(DjangoObjectType):
    pk = graphene.Field(type=graphene.UUID, source='id')

    class Meta:
        model = Room
        filter_fields = ['owner']
        interfaces = (graphene.relay.Node, )


class BookshelfNode(DjangoObjectType):
    pk = graphene.Field(type=graphene.UUID, source='id')

    class Meta:
        model = Bookshelf
        filter_fields = ['owner', 'room']
        interfaces = (graphene.relay.Node, )


class NotebookNode(DjangoObjectType):
    pk = graphene.Field(type=graphene.UUID, source='id')

    class Meta:
        model = Notebook
        filter_fields = ['owner', 'bookshelf']
        interfaces = (graphene.relay.Node, )


class PageNode(DjangoObjectType):
    pk = graphene.Field(type=graphene.UUID, source='id')

    class Meta:
        model = Page
        filter_fields = ['owner', 'notebook']
        interfaces = (graphene.relay.Node, )


class ElementNode(DjangoObjectType):
    pk = graphene.Field(type=graphene.UUID, source='id')

    class Meta:
        model = Element
        filter_fields = ['owner', 'page']
        interfaces = (graphene.relay.Node, )


class CreateRoom(graphene.relay.ClientIDMutation):
    room = graphene.Field(RoomNode)

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        room = Room.objects.create(
            owner=info.context.user
        )
        return CreateRoom(room=room)


class CreateBookshelf(graphene.relay.ClientIDMutation):
    class Input:
        room_id = graphene.UUID(required=True)

    bookshelf = graphene.Field(BookshelfNode)

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        room = Room.objects.get(id=input['room_id'])
        bookshelf = Bookshelf.objects.create(
            owner=info.context.user,
            room=room
        )

        room.bookshelf_order.append(bookshelf.id)

        return CreateBookshelf(bookshelf=bookshelf)


class CreateNotebook(graphene.relay.ClientIDMutation):
    class Input:
        bookshelf_id = graphene.UUID(required=True)

    notebook = graphene.Field(NotebookNode)

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        bookshelf = Bookshelf.objects.get(id=input['bookshelf_id'])
        notebook = Notebook.objects.create(
            owner=info.context.user,
            bookshelf=bookshelf
        )

        bookshelf.notebook_order.append(notebook.id)

        return CreateNotebook(notebook=notebook)


class CreatePage(graphene.relay.ClientIDMutation):
    class Input:
        notebook_id = graphene.UUID(required=True)
        pattern_style = graphene.String(required=True)
        pattern_color = graphene.String(required=True)
        pattern_size = graphene.Float(required=True)
        pattenr_spacing = graphene.Float(required=True)

    page = graphene.Field(PageNode)

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        notebook = Notebook.objects.get(id=input['notebook_id'])
        page = Page.objects.create(
            owner=info.context.user,
            notebook=notebook
        )

        notebook.page_order.append(page.id)

        return CreatePage(page=page)


class CreateElement(graphene.relay.ClientIDMutation):
    class Input:
        page_id = graphene.UUID(required=True)
        tool = graphene.Number(required=True)
        fill_color = graphene.String(required=True)
        stroke_color = graphene.String(required=True)
        size = graphene.Float(required=True)
        is_ruler_line = graphene.Boolean(required=True)
        points = graphene.List(graphene.JSONString, required=True)
        options = graphene.JSONString(required=False)

    element = graphene.Field(ElementNode)

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        page = Page.objects.get(id=input['page_id'])
        element = Element.objects.create(
            owner=info.context.user,
            **input
        )

        return CreateElement(element=element)
