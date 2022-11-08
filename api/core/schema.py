import graphene
from django.db.models import Q
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField

from api.permissions import IsOwner, login_required
from .models import Palette, PaletteCollection, PaletteSwatch, Room, Bookshelf, Notebook, Page, Element


class RoomNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Room
        filter_fields = ['id', 'owner']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class BookshelfNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Bookshelf
        filter_fields = ['id', 'owner', 'room']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class NotebookNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Notebook
        filter_fields = ['id', 'owner', 'bookshelf']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class PageNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Page
        filter_fields = ['id', 'owner', 'notebook']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class ElementNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Element
        filter_fields = ['id', 'owner', 'page']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class PaletteCollectionNode(IsOwner, DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = PaletteCollection
        filter_fields = ['id', 'owner']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class PaletteNode(DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = Palette
        filter_fields = ['id', 'owner']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False

    @classmethod
    def get_queryset(cls, queryset, info):
        return queryset.filter(Q(owner=info.context.user) | Q(is_public=True))


class PaletteSwatchNode(DjangoObjectType):
    pk = graphene.UUID(source='id', required=True)

    class Meta:
        model = PaletteSwatch
        filter_fields = ['id', 'owner']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False

    @classmethod
    def get_queryset(cls, queryset, info):
        return queryset.filter(Q(owner=info.context.user) | Q(palette__is_public=True))

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
        room_pk = graphene.UUID(required=True)

    bookshelf = graphene.Field(BookshelfNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        room = Room.objects.get(id=input['room_pk'])
        bookshelf = Bookshelf.objects.create(
            owner=info.context.user,
            room=room
        )

        return CreateBookshelf(bookshelf=bookshelf)


class UpdateBookshelf(graphene.relay.ClientIDMutation):
    class Input:
        pk = graphene.UUID(required=True)
        notebook_order = graphene.List(graphene.UUID, required=False)

    bookshelf = graphene.Field(BookshelfNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        bookshelf = Bookshelf.objects.get(id=input['pk'])

        for k, v in input.items():
            if k == 'id':
                continue
            setattr(bookshelf, k, v)

        bookshelf.save()

        return UpdateBookshelf(bookshelf=bookshelf)


class CreateNotebook(graphene.relay.ClientIDMutation):
    class Input:
        bookshelf_pk = graphene.UUID(required=True)
        title = graphene.String(required=False)

    notebook = graphene.Field(NotebookNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        bookshelf = Bookshelf.objects.get(id=input['bookshelf_pk'])
        notebook = Notebook.objects.create(
            owner=info.context.user,
            bookshelf=bookshelf,
            title=input.get('title', None)
        )

        return CreateNotebook(notebook=notebook)


class UpdateNotebook(graphene.relay.ClientIDMutation):
    class Input:
        pk = graphene.UUID(required=True)
        title = graphene.String(required=False)
        bookshelf_pk = graphene.UUID(required=False)
        page_order = graphene.List(graphene.UUID, required=False)

    notebook = graphene.Field(NotebookNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        notebook = Notebook.objects.get(id=input['pk'])

        for k, v in input.items():
            if k == 'id':
                continue

            if k == 'bookshelf_pk':
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
        pk = graphene.UUID(required=True)

    notebook = graphene.Field(NotebookNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        notebook = Notebook.objects.get(id=input['pk'])
        notebook.delete()

        return DeleteNotebook(notebook=notebook)


class CreatePage(graphene.relay.ClientIDMutation):
    class Input:
        notebook_pk = graphene.UUID(required=True)
        paper_swatch_pk = graphene.UUID(required=False)
        pattern_swatch_pk = graphene.UUID(required=False)
        pattern_type = graphene.Int(required=False)
        pattern_size = graphene.Float(required=False)
        pattern_spacing = graphene.Float(required=False)
        pattern_opacity = graphene.Int(required=False)

    page = graphene.Field(PageNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        notebook = Notebook.objects.get(id=input['notebook_pk'])
        page = Page.objects.create(
            owner=info.context.user,
            notebook=notebook,
        )

        for k, v in input.items():
            if k == 'notebook_pk':
                continue

            if k == 'paper_swatch_pk':
                page.paper_swatch = PaletteSwatch.objects.get(id=v)
                continue

            if k == 'pattern_swatch_pk':
                page.pattern_swatch = PaletteSwatch.objects.get(id=v)
                continue

            setattr(page, k, v)

        page.save()

        return CreatePage(page=page)


class UpdatePage(graphene.relay.ClientIDMutation):
    class Input:
        pk = graphene.UUID(required=True)
        notebook_pk = graphene.UUID(required=False)
        paper_swatch_pk = graphene.UUID(required=False)
        pattern_swatch_pk = graphene.UUID(required=False)
        pattern_type = graphene.Int(required=False)
        pattern_size = graphene.Float(required=False)
        pattern_spacing = graphene.Float(required=False)
        pattern_opacity = graphene.Int(required=False)

    page = graphene.Field(PageNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        page = Page.objects.get(id=input['pk'])

        for k, v in input.items():
            if k == 'id':
                continue

            if k == 'notebook_pk':
                current_notebook = page.notebook
                current_notebook.page_order.remove(page.id)
                current_notebook.save()

                new_notebook = Notebook.objects.get(id=v)
                new_notebook.page_order.append(page.id)
                new_notebook.save()

                page.notebook = new_notebook
                continue

            if k == 'paper_swatch_pk':
                page.paper_swatch = PaletteSwatch.objects.get(id=v)
                continue

            if k == 'pattern_swatch_pk':
                page.pattern_swatch = PaletteSwatch.objects.get(id=v)
                continue

            setattr(page, k, v)

        page.save()

        return UpdatePage(page=page)


class DeletePage(graphene.relay.ClientIDMutation):
    class Input:
        pk = graphene.UUID(required=True)

    page = graphene.Field(PageNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        page = Page.objects.get(id=input['pk'])
        page.delete()

        return DeletePage(page=page)


class CreateElement(graphene.relay.ClientIDMutation):
    class Input:
        page_pk = graphene.UUID(required=True)
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
        page = Page.objects.get(id=input['page_pk'])
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
        pk = graphene.UUID(required=True)
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
        element = Element.objects.get(id=input['pk'])

        for k, v in input.items():
            if k == 'pk':
                continue
            setattr(element, k, v)

        element.save()

        return UpdateElement(element=element)


class DeleteElement(graphene.relay.ClientIDMutation):
    class Input:
        pk = graphene.UUID(required=True)

    element = graphene.Field(ElementNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        element = Element.objects.get(id=input['pk'])
        element.delete()

        return DeleteElement(element=element)


class CreatePalette(graphene.relay.ClientIDMutation):
    class Input:
        title = graphene.String(required=False)
        swatches = graphene.List(graphene.JSONString, required=False)

    palette = graphene.Field(PaletteNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        collection = PaletteCollection.objects.get(owner=info.context.user)
        palette = Palette.objects.create(
            owner=info.context.user
        )
        palette.collections.add(collection)

        for k, v in input.items():
            if k == 'swatches':
                for swatch_json in v:
                    swatch = PaletteSwatch.objects.create(
                        owner=info.context.user,
                        palette=palette,
                        swatch=swatch_json,
                    )
                    swatch.save()
                continue

            setattr(palette, k, v)

        palette.save()

        return CreatePalette(palette=palette)


class UpdatePalette(graphene.relay.ClientIDMutation):
    class Input:
        pk = graphene.UUID(required=True)
        title = graphene.String(required=False)

    palette = graphene.Field(PaletteNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        palette = Palette.objects.get(id=input['pk'])

        if palette.owner != info.context.user:
            raise Exception('You do not have permission to update this palette.')

        for k, v in input.items():
            if k == 'pk':
                continue
            setattr(palette, k, v)

        palette.save()

        return UpdatePalette(palette=palette)


class DeletePalette(graphene.relay.ClientIDMutation):
    class Input:
        pk = graphene.UUID(required=True)

    palette = graphene.Field(PaletteNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        palette = Palette.objects.get(id=input['pk'])

        if palette.owner != info.context.user:
            raise Exception('You do not have permission to update this palette.')

        palette.delete()

        return DeletePalette(palette=palette)


class CreatePaletteSwatch(graphene.relay.ClientIDMutation):
    class Input:
        palette_pk = graphene.UUID(required=True)
        swatch = graphene.JSONString(required=True)

    swatch = graphene.Field(PaletteSwatchNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        palette = Palette.objects.get(id=input['palette_pk'])
        swatch = PaletteSwatch.objects.create(
            owner=info.context.user,
            palette=palette,
            swatch=input['swatch'],
        )

        return CreatePaletteSwatch(swatch=swatch)


class UpdatePaletteSwatch(graphene.relay.ClientIDMutation):
    class Input:
        pk = graphene.UUID(required=True)
        swatch = graphene.JSONString(required=False)

    swatch = graphene.Field(PaletteSwatchNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        swatch = PaletteSwatch.objects.get(id=input['pk'])

        if swatch.owner != info.context.user:
            raise Exception('You do not have permission to update this palette.')

        for k, v in input.items():
            if k == 'pk':
                continue
            setattr(swatch, k, v)

        swatch.save()

        return UpdatePaletteSwatch(swatch=swatch)


class DeletePaletteSwatch(graphene.relay.ClientIDMutation):
    class Input:
        pk = graphene.UUID(required=True)

    swatch = graphene.Field(PaletteSwatchNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        swatch = PaletteSwatch.objects.get(id=input['pk'])

        if swatch.owner != info.context.user:
            raise Exception('You do not have permission to update this palette.')

        swatch.delete()

        return DeletePaletteSwatch(swatch=swatch)


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

    palette_collection = graphene.relay.Node.Field(PaletteCollectionNode)
    my_palette_collection = DjangoFilterConnectionField(PaletteCollectionNode)

    palette = graphene.relay.Node.Field(PaletteNode)
    my_palettes = DjangoFilterConnectionField(PaletteNode)

    palette_swatch = graphene.relay.Node.Field(PaletteSwatchNode)
    my_palette_swatchs = DjangoFilterConnectionField(PaletteSwatchNode)


class CoreMutation(graphene.ObjectType):
    # create_room = CreateRoom.Field()

    create_bookshelf = CreateBookshelf.Field()
    update_bookshelf = UpdateBookshelf.Field()

    create_notebook = CreateNotebook.Field()
    update_notebook = UpdateNotebook.Field()
    delete_notebook = DeleteNotebook.Field()

    create_page = CreatePage.Field()
    update_page = UpdatePage.Field()
    delete_page = DeletePage.Field()

    create_element = CreateElement.Field()
    update_element = UpdateElement.Field()
    delete_element = DeleteElement.Field()

    create_palette = CreatePalette.Field()
    update_palette = UpdatePalette.Field()
    delete_palette = DeletePalette.Field()

    create_palette_swatch = CreatePaletteSwatch.Field()
    update_palette_swatch = UpdatePaletteSwatch.Field()
    delete_palette_swatch = DeletePaletteSwatch.Field()
