import graphene
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField

from api.permissions import IsOwner, login_required
from .models import Room, Bookshelf, Notebook, Page, Element


class RoomNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Room
        filter_fields = ['owner']
        interfaces = (graphene.relay.Node, )


class BookshelfNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Bookshelf
        filter_fields = ['owner', 'room']
        interfaces = (graphene.relay.Node, )


class NotebookNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Notebook
        filter_fields = ['owner', 'bookshelf']
        interfaces = (graphene.relay.Node, )


class PageNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Page
        filter_fields = ['owner', 'notebook']
        interfaces = (graphene.relay.Node, )


class ElementNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Element
        filter_fields = ['owner', 'page']
        interfaces = (graphene.relay.Node, )


class CreateRoom(graphene.relay.ClientIDMutation):
    room = graphene.Field(RoomNode)

    @classmethod
    @login_required
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
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        room = Room.objects.get(id=input['room_id'])
        bookshelf = Bookshelf.objects.create(
            owner=info.context.user,
            room=room
        )

        return CreateBookshelf(bookshelf=bookshelf)


class UpdateBookshelf(graphene.relay.ClientIDMutation):
    class Input:
        bookshelf_id = graphene.UUID(required=True)
        notebook_order = graphene.List(graphene.UUID, required=False)

    bookshelf = graphene.Field(BookshelfNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        bookshelf = Bookshelf.objects.get(id=input['bookshelf_id'])

        for k, v in input.items():
            if k == 'id':
                continue
            setattr(bookshelf, k, v)

        bookshelf.save()

        return UpdateBookshelf(bookshelf=bookshelf)


class CreateNotebook(graphene.relay.ClientIDMutation):
    class Input:
        bookshelf_id = graphene.UUID(required=True)
        title = graphene.String(required=False)

    notebook = graphene.Field(NotebookNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        bookshelf = Bookshelf.objects.get(id=input['bookshelf_id'])
        notebook = Notebook.objects.create(
            owner=info.context.user,
            bookshelf=bookshelf,
            title=input.get('title', None)
        )

        return CreateNotebook(notebook=notebook)


class UpdateNotebook(graphene.relay.ClientIDMutation):
    class Input:
        id = graphene.UUID(required=True)
        title = graphene.String(required=False)
        bookshelf_id = graphene.UUID(required=False)
        page_order = graphene.List(graphene.UUID, required=False)

    notebook = graphene.Field(NotebookNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        notebook = Notebook.objects.get(id=input['id'])

        for k, v in input.items():
            if k == 'id':
                continue

            if k == 'bookshelf_id':
                current_shelf = notebook.bookshelf
                current_shelf.notebook_order.remove(notebook.id)
                current_shelf.save()

                new_bookshelf = Bookshelf.objects.get(id=v)
                new_bookshelf.notebook_order.append(notebook.id)
                new_bookshelf.save()
                notebook.bookshelf = new_bookshelf
                continue

            setattr(notebook, k, v)

        notebook.save()

        return UpdateNotebook(notebook=notebook)


class DeleteNotebook(graphene.relay.ClientIDMutation):
    class Input:
        id = graphene.UUID(required=True)

    notebook = graphene.Field(NotebookNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        notebook = Notebook.objects.get(id=input['notebook_id'])
        notebook.delete()

        return DeleteNotebook(notebook=notebook)


class CreatePage(graphene.relay.ClientIDMutation):
    class Input:
        notebook_id = graphene.UUID(required=True)
        pattern_style = graphene.String(required=False)
        pattern_color = graphene.String(required=False)
        pattern_size = graphene.Float(required=False)
        pattern_spacing = graphene.Float(required=False)

    page = graphene.Field(PageNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        notebook = Notebook.objects.get(id=input['notebook_id'])
        page = Page.objects.create(
            owner=info.context.user,
            notebook=notebook,
            pattern_style=input.get('pattern_style', None),
            pattern_color=input.get('pattern_color', None),
            pattern_size=input.get('pattern_size', None),
            pattern_spacing=input.get('pattern_spacing', None)
        )

        return CreatePage(page=page)


class UpdatePage(graphene.relay.ClientIDMutation):
    class Input:
        id = graphene.UUID(required=True)
        notebook_id = graphene.UUID(required=False)
        pattern_style = graphene.String(required=False)
        pattern_color = graphene.String(required=False)
        pattern_size = graphene.Float(required=False)
        pattern_spacing = graphene.Float(required=False)

    page = graphene.Field(PageNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        page = Page.objects.get(id=input['id'])

        for k, v in input.items():
            if k == 'id':
                continue

            if k == 'notebook_id':
                current_notebook = page.notebook
                current_notebook.page_order.remove(page.id)
                current_notebook.save()

                new_notebook = Notebook.objects.get(id=v)
                new_notebook.page_order.append(page.id)
                new_notebook.save()

                page.notebook = new_notebook
                continue

            setattr(page, k, v)

        page.save()

        return UpdatePage(page=page)


class DeletePage(graphene.relay.ClientIDMutation):
    class Input:
        id = graphene.UUID(required=True)

    page = graphene.Field(PageNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        page = Page.objects.get(id=input['page_id'])
        page.delete()

        return DeletePage(page=page)


class CreateElement(graphene.relay.ClientIDMutation):
    class Input:
        page_id = graphene.UUID(required=True)
        tool = graphene.Int(required=True)
        fill_color = graphene.String(required=True)
        stroke_color = graphene.String(required=True)
        size = graphene.Float(required=True)
        is_ruler_line = graphene.Boolean(required=True)
        points = graphene.List(graphene.JSONString, required=True)
        options = graphene.JSONString(required=False)

    element = graphene.Field(ElementNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        page = Page.objects.get(id=input['page_id'])
        element = Element.objects.create(
            owner=info.context.user,
            page=page,
            tool=input['tool'],
            fill_color=input['fill_color'],
            stroke_color=input['stroke_color'],
            size=input['size'],
            is_ruler_line=input['is_ruler_line'],
            points=input['points'],
            options=input.get('options', None)
        )

        return CreateElement(element=element)


class UpdateElement(graphene.relay.ClientIDMutation):
    class Input:
        id = graphene.UUID(required=True)
        tool = graphene.Int(required=False)
        fill_color = graphene.String(required=False)
        stroke_color = graphene.String(required=False)
        size = graphene.Float(required=False)
        is_ruler_line = graphene.Boolean(required=False)
        points = graphene.List(graphene.JSONString, required=False)
        options = graphene.JSONString(required=False)

    element = graphene.Field(ElementNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        element = Element.objects.get(id=input['id'])

        for k, v in input.items():
            if k == 'id':
                continue
            setattr(element, k, v)

        element.save()

        return UpdateElement(element=element)


class DeleteElement(graphene.relay.ClientIDMutation):
    class Input:
        id = graphene.UUID(required=True)

    element = graphene.Field(ElementNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        element = Element.objects.get(id=input['element_id'])
        element.delete()

        return DeleteElement(element=element)


class CoreQuery(graphene.ObjectType):
    room = graphene.relay.Node.Field(RoomNode)
    my_rooms = DjangoFilterConnectionField(RoomNode)

    bookshelf = graphene.relay.Node.Field(BookshelfNode)
    my_bookshelves = DjangoFilterConnectionField(BookshelfNode)

    notebook = graphene.relay.Node.Field(NotebookNode)
    my_notebooks = DjangoFilterConnectionField(NotebookNode)

    page = graphene.relay.Node.Field(PageNode)
    my_pages = DjangoFilterConnectionField(PageNode)

    element = graphene.relay.Node.Field(ElementNode)
    my_elements = DjangoFilterConnectionField(ElementNode)


class CoreMutation(graphene.ObjectType):
    # create_room = CreateRoom.Field()

    # create_bookshelf = CreateBookshelf.Field()
    # update_bookshelf = UpdateBookshelf.Field()

    create_notebook = CreateNotebook.Field()
    update_notebook = UpdateNotebook.Field()
    delete_notebook = DeleteNotebook.Field()

    create_page = CreatePage.Field()
    update_page = UpdatePage.Field()
    delete_page = DeletePage.Field()

    create_element = CreateElement.Field()
    update_element = UpdateElement.Field()
    delete_element = DeleteElement.Field()
